import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.user import User
from app.models.profile import StudentProfile
from app.schemas.user import StudentProfileUpdate, StudentProfileOut, PublicUserOut


class UserService:
    @staticmethod
    async def update_student_profile(
        db: AsyncSession, user_id: uuid.UUID, data: StudentProfileUpdate
    ) -> StudentProfile:
        """Update student profile details."""
        stmt = select(StudentProfile).where(StudentProfile.user_id == user_id)
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()

        if not profile:
            raise HTTPException(status_code=404, detail="Student profile not found.")

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(profile, key, value)

        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def get_public_profile(
        db: AsyncSession, user_id: uuid.UUID
    ) -> PublicUserOut:
        """Fetch sanitized public student profile for other campus members."""
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.college), selectinload(User.profile))
        )
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user or user.account_status != "active":
            raise HTTPException(status_code=404, detail="Student profile not found.")

        profile_out = (
            StudentProfileOut.model_validate(user.profile) if user.profile else None
        )

        return PublicUserOut(
            id=user.id,
            college_name=user.college.name if user.college else "Unknown Campus",
            campus_name=user.college.campus_name if user.college else "Campus",
            is_email_verified=user.is_email_verified,
            profile=profile_out,
        )
