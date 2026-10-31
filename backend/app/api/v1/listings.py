import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_optional_user
from app.models.user import User
from app.schemas.listing import (
    ListingDetailOut,
    PaginatedListingsResponse,
)
from app.services.listing_service import ListingService

router = APIRouter(prefix="/listings", tags=["Marketplace Listings"])


@router.get("", response_model=PaginatedListingsResponse, status_code=status.HTTP_200_OK)
async def get_listings(
    college_id: Optional[uuid.UUID] = Query(None, description="Filter by specific campus ID"),
    category: Optional[str] = Query(None, description="Category slug"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price in INR"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price in INR"),
    condition: Optional[str] = Query(None, description="like_new, excellent, good, fair"),
    q: Optional[str] = Query(None, description="Search term for title and description"),
    sort: str = Query("recent", description="recent | price_asc | price_desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=50, description="Items per page"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Search and filter active campus marketplace listings.
    If logged in, scopes to student's campus by default unless college_id is explicitly overridden.
    """
    active_college_id = college_id or (current_user.college_id if current_user else None)

    results = await ListingService.search_marketplace(
        db=db,
        college_id=active_college_id,
        category_slug=category,
        min_price=min_price,
        max_price=max_price,
        condition=condition,
        query=q,
        sort=sort,
        page=page,
        limit=limit,
    )
    return results


@router.get("/{listing_id}", response_model=ListingDetailOut, status_code=status.HTTP_200_OK)
async def get_listing_detail(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Fetch complete public product detail with seller profile, condition, and multi-image gallery."""
    listing = await ListingService.get_listing_by_id(db, listing_id)
    if not listing or listing.status not in ("active", "reserved", "sold"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product listing not found or is currently unavailable.",
        )
    listing.view_count = (listing.view_count or 0) + 1
    await db.commit()
    return ListingService.format_listing_detail(listing)
