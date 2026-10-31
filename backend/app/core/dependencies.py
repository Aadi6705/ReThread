import uuid
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User
from app.services.auth_service import AuthService

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract current authenticated user from HttpOnly cookie or Bearer header.
    Prefers secure HttpOnly cookie `access_token`.
    """
    token: Optional[str] = None

    # 1. Check explicit Bearer token header first, fallback to HttpOnly cookie
    if bearer and bearer.credentials:
        token = bearer.credentials
    elif request.cookies.get("access_token"):
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    try:
        user_id = uuid.UUID(user_id_str)
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed credentials.")

    user = await AuthService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")

    if user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated.",
        )

    return user


async def get_verified_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the student has verified their college email address."""
    if not current_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your college email address to access this marketplace feature.",
        )
    return current_user


async def get_optional_user(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Optional user dependency for public routes with enhanced context."""
    try:
        return await get_current_user(request, bearer, db)
    except HTTPException:
        return None
