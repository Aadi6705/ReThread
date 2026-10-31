import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import (
    StudentProfileOut,
    StudentProfileUpdate,
    PublicUserOut,
)
from app.schemas.seller import SellerReputationOut
from app.services.user_service import UserService
from app.services.seller_service import SellerService

router = APIRouter(prefix="/users", tags=["Users & Profiles"])


@router.get("/me", response_model=StudentProfileOut)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """Retrieve the authenticated student's profile."""
    return current_user.profile


@router.patch("/me", response_model=StudentProfileOut)
async def update_my_profile(
    data: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update profile information (bio, department, academic year, avatar)."""
    updated_profile = await UserService.update_student_profile(
        db, current_user.id, data
    )
    return updated_profile


@router.get("/{user_id}", response_model=PublicUserOut)
async def get_user_public_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve sanitized public student profile for other campus members."""
    return await UserService.get_public_profile(db, user_id)


@router.get("/{user_id}/reputation", response_model=SellerReputationOut)
async def get_seller_reputation(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve seller's public campus reputation stats, verified sales, and active listings."""
    return await SellerService.get_seller_reputation(db, user_id)
