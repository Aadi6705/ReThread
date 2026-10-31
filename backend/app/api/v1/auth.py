from fastapi import APIRouter, Depends, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserOut,
    TokenResponse,
    VerifyEmailRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_SECURE = settings.APP_ENV != "development"


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Set secure HttpOnly cookies for session management."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth",
    )


def clear_auth_cookies(response: Response):
    """Clear session cookies upon logout."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")


@router.post(
    "/register", response_model=UserOut, status_code=status.HTTP_201_CREATED
)
async def register(
    data: UserRegister,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Register a new student using an official college email domain."""
    user, plain_token = await AuthService.register_student(db, data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate student credentials and issue secure session cookies."""
    user, access_token, refresh_token = await AuthService.authenticate_user(
        db, data
    )
    set_auth_cookies(response, access_token, refresh_token)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    """Log out student and clear HttpOnly session cookies."""
    clear_auth_cookies(response)
    return {"message": "Logged out successfully."}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Rotate session refresh token and issue a fresh access token."""
    refresh_tok = request.cookies.get("refresh_token")
    if not refresh_tok:
        # Fallback to header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            refresh_tok = auth_header.split(" ")[1]

    if not refresh_tok:
        return Response(status_code=status.HTTP_401_UNAUTHORIZED)

    user, new_access, new_refresh = await AuthService.refresh_tokens(
        db, refresh_tok
    )
    set_auth_cookies(response, new_access, new_refresh)
    return TokenResponse(
        access_token=new_access,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify official student email address using secure verification token."""
    user = await AuthService.verify_email(db, data.token)
    return {
        "message": "Student email verified successfully! Welcome to ReThread campus.",
        "user_id": user.id,
        "is_email_verified": True,
    }


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification(
    data: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Resend a fresh email verification link."""
    await AuthService.resend_verification(db, data.email)
    return {
        "message": "If an unverified account exists for this email, a verification link has been dispatched."
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Initiate password reset workflow."""
    await AuthService.request_password_reset(db, data.email)
    return {
        "message": "If this email is registered, a password reset link has been dispatched."
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Complete password reset using valid reset token."""
    await AuthService.reset_password(db, data.token, data.new_password)
    return {"message": "Password reset successfully. You can now log in with your new credentials."}


@router.get("/me", response_model=UserOut)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Fetch current authenticated student profile and college context."""
    return current_user
