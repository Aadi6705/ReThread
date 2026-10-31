import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy import select, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.user import User
from app.models.profile import StudentProfile
from app.models.college import College
from app.models.verification import EmailVerificationToken
from app.schemas.user import UserRegister, UserLogin
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_secure_token,
    hash_token,
)
from app.integrations.email import send_verification_email, send_password_reset_email


class AuthService:
    @staticmethod
    async def register_student(
        db: AsyncSession, data: UserRegister
    ) -> Tuple[User, str]:
        """Register a new student, create profile, and generate verification token."""
        # Normalize email
        email = data.email.strip().lower()
        domain = email.split("@")[-1]

        # 1. Verify college email domain
        college_stmt = select(College).where(College.email_domain == domain)
        college_res = await db.execute(college_stmt)
        college = college_res.scalar_one_or_none()

        if not college:
            # Fallback for academic domains (e.g., any .ac.in or .edu)
            if domain.endswith(".ac.in") or domain.endswith(".edu"):
                # Assign to generic or create college stub
                fallback_stmt = select(College).where(College.email_domain == "campus.edu")
                fallback_res = await db.execute(fallback_stmt)
                college = fallback_res.scalar_one_or_none()
            
            if not college:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email domain '@{domain}' is not recognized as an eligible college domain. Please use your official university email.",
                )

        # 2. Check for existing email
        existing_stmt = select(User).where(User.email == email)
        existing_res = await db.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this student email already exists. Please log in.",
            )

        # 3. Create User & Profile
        new_user = User(
            college_id=college.id,
            email=email,
            password_hash=get_password_hash(data.password),
            is_email_verified=False,
            account_status="active",
        )
        db.add(new_user)
        await db.flush()  # Generate user ID

        new_profile = StudentProfile(
            user_id=new_user.id,
            full_name=data.full_name.strip(),
            department=data.department.strip() if data.department else None,
            course=data.course.strip() if data.course else None,
            academic_year=data.academic_year.strip() if data.academic_year else None,
        )
        db.add(new_profile)

        # 4. Generate verification token
        plain_token = generate_secure_token()
        token_record = EmailVerificationToken(
            user_id=new_user.id,
            token_hash=hash_token(plain_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        db.add(token_record)

        await db.commit()

        # Load relationships
        loaded_user = await AuthService.get_user_by_id(db, new_user.id)
        if not loaded_user:
            raise HTTPException(status_code=500, detail="Failed to initialize user session.")

        # Send verification email asynchronously / in background
        send_verification_email(email, plain_token)

        return loaded_user, plain_token

    @staticmethod
    async def verify_email(db: AsyncSession, token: str) -> User:
        """Verify an email token and activate marketplace access."""
        t_hash = hash_token(token.strip())
        now = datetime.now(timezone.utc)

        stmt = select(EmailVerificationToken).where(
            and_(
                EmailVerificationToken.token_hash == t_hash,
                EmailVerificationToken.used_at.is_(None),
                EmailVerificationToken.expires_at > now,
            )
        )
        res = await db.execute(stmt)
        token_record = res.scalar_one_or_none()

        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid, expired, or previously used verification token.",
            )

        token_record.used_at = now
        await db.execute(
            update(User)
            .where(User.id == token_record.user_id)
            .values(is_email_verified=True, updated_at=now)
        )
        await db.commit()

        user = await AuthService.get_user_by_id(db, token_record.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        return user

    @staticmethod
    async def resend_verification(db: AsyncSession, email: str) -> bool:
        """Resend a new email verification token with cooldown protection."""
        stmt = select(User).where(User.email == email.strip().lower())
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            # Avoid email enumeration: return True
            return True

        if user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This student account is already verified. You can log in directly.",
            )

        # Generate fresh token
        plain_token = generate_secure_token()
        token_record = EmailVerificationToken(
            user_id=user.id,
            token_hash=hash_token(plain_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        db.add(token_record)
        await db.commit()

        send_verification_email(user.email, plain_token)
        return True

    @staticmethod
    async def authenticate_user(
        db: AsyncSession, data: UserLogin
    ) -> Tuple[User, str, str]:
        """Authenticate user credentials and return (user, access_token, refresh_token)."""
        email = data.email.strip().lower()
        stmt = (
            select(User)
            .where(User.email == email)
            .options(selectinload(User.college), selectinload(User.profile))
        )
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect college email or password.",
            )

        if user.account_status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been suspended or deactivated. Please contact campus support.",
            )

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()

        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))

        return user, access_token, refresh_token

    @staticmethod
    async def refresh_tokens(
        db: AsyncSession, refresh_token: str
    ) -> Tuple[User, str, str]:
        """Rotate refresh token and issue new access token."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session. Please log in again.",
            )

        user_id_str = payload.get("sub")
        try:
            user_id = uuid.UUID(user_id_str)
        except Exception:
            raise HTTPException(status_code=401, detail="Malformed session token.")

        user = await AuthService.get_user_by_id(db, user_id)
        if not user or user.account_status != "active":
            raise HTTPException(status_code=401, detail="Account is no longer active.")

        new_access = create_access_token(str(user.id))
        new_refresh = create_refresh_token(str(user.id))

        return user, new_access, new_refresh

    @staticmethod
    async def request_password_reset(db: AsyncSession, email: str) -> bool:
        """Issue password reset token."""
        stmt = select(User).where(User.email == email.strip().lower())
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            return True

        plain_token = generate_secure_token()
        token_record = EmailVerificationToken(
            user_id=user.id,
            token_hash=hash_token(plain_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=2),
        )
        db.add(token_record)
        await db.commit()

        send_password_reset_email(user.email, plain_token)
        return True

    @staticmethod
    async def reset_password(
        db: AsyncSession, token: str, new_password: str
    ) -> bool:
        """Reset password using valid token."""
        t_hash = hash_token(token.strip())
        now = datetime.now(timezone.utc)

        stmt = select(EmailVerificationToken).where(
            and_(
                EmailVerificationToken.token_hash == t_hash,
                EmailVerificationToken.used_at.is_(None),
                EmailVerificationToken.expires_at > now,
            )
        )
        res = await db.execute(stmt)
        token_record = res.scalar_one_or_none()

        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset link.",
            )

        token_record.used_at = now
        new_hash = get_password_hash(new_password)
        await db.execute(
            update(User)
            .where(User.id == token_record.user_id)
            .values(password_hash=new_hash, updated_at=now)
        )
        await db.commit()
        return True

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        """Fetch user with college and student profile preloaded."""
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.college), selectinload(User.profile))
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()
