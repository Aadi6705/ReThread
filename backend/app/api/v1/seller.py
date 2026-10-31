import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_verified_user
from app.models.user import User
from app.schemas.listing import (
    ListingCreate,
    ListingUpdate,
    ListingDetailOut,
)
from app.schemas.seller import (
    SellerDashboardOut,
    SellerListingCounts,
)
from app.services.listing_service import ListingService
from app.services.seller_service import SellerService

router = APIRouter(prefix="/seller", tags=["Seller Portal & Listings"])


@router.get("/dashboard", response_model=SellerDashboardOut, status_code=status.HTTP_200_OK)
async def get_seller_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve live aggregated seller performance metrics, listing view stats,
    enquiries summary, and recent campus buyer activity.
    """
    return await SellerService.get_seller_dashboard(db, current_user.id)


@router.get("/listings/counts", response_model=SellerListingCounts, status_code=status.HTTP_200_OK)
async def get_seller_listing_counts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve total count of listings for seller grouped by status."""
    return await SellerService.get_seller_listing_counts(db, current_user.id)


@router.post("/listings", response_model=ListingDetailOut, status_code=status.HTTP_201_CREATED)
async def create_seller_listing(
    data: ListingCreate,
    current_user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new listing (draft or active) for the authenticated student."""
    listing = await ListingService.create_listing(db, current_user, data)
    return ListingService.format_listing_detail(listing)


@router.get("/listings", response_model=List[ListingDetailOut], status_code=status.HTTP_200_OK)
async def get_my_seller_listings(
    status_filter: Optional[str] = Query("all", description="all, draft, active, reserved, sold, archived"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all listings owned by the authenticated student."""
    listings = await ListingService.get_seller_listings(db, current_user.id, status_filter)
    return [ListingService.format_listing_detail(l) for l in listings]


@router.get("/listings/{listing_id}", response_model=ListingDetailOut, status_code=status.HTTP_200_OK)
async def get_my_listing_by_id(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a specific listing owned by the authenticated student."""
    listing = await ListingService.get_listing_by_id(db, listing_id)
    if not listing or listing.seller_id != current_user.id:
        raise HTTPException(status_code=404, detail="Listing not found in your inventory.")
    return ListingService.format_listing_detail(listing)


@router.patch("/listings/{listing_id}", response_model=ListingDetailOut, status_code=status.HTTP_200_OK)
async def update_my_listing(
    listing_id: uuid.UUID,
    data: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update details, photos, or price of an existing listing."""
    listing = await ListingService.update_listing(db, current_user, listing_id, data)
    return ListingService.format_listing_detail(listing)


@router.delete("/listings/{listing_id}", status_code=status.HTTP_200_OK)
async def delete_my_draft_listing(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a draft listing. Published listings must be archived instead."""
    await ListingService.delete_draft(db, current_user.id, listing_id)
    return {"message": "Draft listing deleted successfully."}


@router.post("/listings/{listing_id}/publish", response_model=ListingDetailOut, status_code=status.HTTP_200_OK)
async def publish_my_listing(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish a draft listing to the active campus marketplace."""
    listing = await ListingService.publish_listing(db, current_user.id, listing_id)
    return ListingService.format_listing_detail(listing)


@router.post("/listings/{listing_id}/archive", response_model=ListingDetailOut, status_code=status.HTTP_200_OK)
async def archive_my_listing(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Archive a listing to remove it from discovery."""
    listing = await ListingService.archive_listing(db, current_user.id, listing_id)
    return ListingService.format_listing_detail(listing)
