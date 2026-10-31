import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.wishlist import WishlistOut, WishlistStatusResponse
from app.services.wishlist_service import WishlistService

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("", response_model=List[WishlistOut], status_code=status.HTTP_200_OK)
async def get_my_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all listings saved in the student's wishlist."""
    items = await WishlistService.get_user_wishlist(db, current_user.id)
    return items


@router.post("/{listing_id}", status_code=status.HTTP_201_CREATED)
async def add_listing_to_wishlist(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a listing to the student's wishlist."""
    await WishlistService.add_to_wishlist(db, current_user, listing_id)
    return {"message": "Listing saved to your wishlist.", "is_wishlisted": True}


@router.delete("/{listing_id}", status_code=status.HTTP_200_OK)
async def remove_listing_from_wishlist(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a listing from the student's wishlist."""
    removed = await WishlistService.remove_from_wishlist(db, current_user.id, listing_id)
    return {"message": "Listing removed from wishlist.", "removed": removed, "is_wishlisted": False}


@router.get("/check/{listing_id}", response_model=WishlistStatusResponse, status_code=status.HTTP_200_OK)
async def check_wishlist_status(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check whether a specific listing is in the student's wishlist."""
    is_saved = await WishlistService.is_wishlisted(db, current_user.id, listing_id)
    return WishlistStatusResponse(listing_id=listing_id, is_wishlisted=is_saved)
