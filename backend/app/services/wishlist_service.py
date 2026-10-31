import uuid
from typing import List, Optional
from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.wishlist import Wishlist
from app.models.listing import Listing
from app.models.user import User
from app.schemas.listing import ListingSummaryOut
from app.schemas.wishlist import WishlistOut


class WishlistService:
    @staticmethod
    async def get_user_wishlist(
        db: AsyncSession, user_id: uuid.UUID
    ) -> List[WishlistOut]:
        """Fetch all listings wishlisted by the user."""
        stmt = (
            select(Wishlist)
            .where(Wishlist.user_id == user_id)
            .options(
                selectinload(Wishlist.listing).selectinload(Listing.images),
                selectinload(Wishlist.listing).selectinload(Listing.category),
                selectinload(Wishlist.listing).selectinload(Listing.college),
                selectinload(Wishlist.listing).selectinload(Listing.seller).selectinload(User.profile),
            )
            .order_by(Wishlist.created_at.desc())
        )
        res = await db.execute(stmt)
        wishlists = res.scalars().all()

        results: List[WishlistOut] = []
        for w in wishlists:
            l = w.listing
            if not l:
                continue
            primary_img = l.images[0].image_url if l.images else None
            seller_name = (
                l.seller.profile.full_name
                if l.seller and l.seller.profile
                else "Student"
            )
            summary = ListingSummaryOut(
                id=l.id,
                seller_id=l.seller_id,
                college_id=l.college_id,
                category_id=l.category_id,
                category_name=l.category.name,
                category_slug=l.category.slug,
                title=l.title,
                price=l.price,
                original_price=l.original_price,
                condition=l.condition,
                brand=l.brand,
                status=l.status,
                primary_image_url=primary_img,
                campus_name=l.college.campus_name,
                college_name=l.college.name,
                seller_name=seller_name,
                seller_is_verified=l.seller.is_email_verified if l.seller else False,
                created_at=l.created_at,
            )
            results.append(
                WishlistOut(
                    id=w.id,
                    user_id=w.user_id,
                    listing_id=w.listing_id,
                    created_at=w.created_at,
                    listing=summary,
                )
            )
        return results

    @staticmethod
    async def add_to_wishlist(
        db: AsyncSession, user: User, listing_id: uuid.UUID
    ) -> Wishlist:
        """Add a listing to the user's wishlist."""
        # 1. Fetch listing
        listing_stmt = select(Listing).where(Listing.id == listing_id)
        listing_res = await db.execute(listing_stmt)
        listing = listing_res.scalar_one_or_none()

        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found.",
            )

        # 2. Prevent wishlisting own listing
        if listing.seller_id == user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot add your own listing to your wishlist.",
            )

        # 3. Check for existing entry
        stmt = select(Wishlist).where(
            and_(Wishlist.user_id == user.id, Wishlist.listing_id == listing_id)
        )
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            return existing

        new_entry = Wishlist(user_id=user.id, listing_id=listing_id)
        db.add(new_entry)
        await db.commit()
        await db.refresh(new_entry)
        return new_entry

    @staticmethod
    async def remove_from_wishlist(
        db: AsyncSession, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> bool:
        """Remove a listing from the user's wishlist."""
        stmt = delete(Wishlist).where(
            and_(Wishlist.user_id == user_id, Wishlist.listing_id == listing_id)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def is_wishlisted(
        db: AsyncSession, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> bool:
        """Check if a specific listing is bookmarked by the user."""
        stmt = select(Wishlist.id).where(
            and_(Wishlist.user_id == user_id, Wishlist.listing_id == listing_id)
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none() is not None
