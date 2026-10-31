import uuid
import math
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.listing import Listing, ListingImage
from app.models.category import Category
from app.models.college import College
from app.models.user import User
from app.schemas.listing import (
    ListingCreate,
    ListingUpdate,
    ListingSummaryOut,
    ListingDetailOut,
    PaginatedListingsResponse,
    ListingImageOut,
)
from app.schemas.category import CategoryOut
from app.schemas.college import CollegeOut
from app.schemas.user import PublicUserOut, StudentProfileOut


class ListingService:
    @staticmethod
    async def get_all_categories(db: AsyncSession) -> List[Category]:
        """Fetch all active categories."""
        stmt = select(Category).where(Category.is_active == True).order_by(Category.name)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def create_listing(
        db: AsyncSession, seller: User, data: ListingCreate
    ) -> Listing:
        """Create a new listing (draft or active)."""
        # Validate category
        cat_stmt = select(Category).where(
            and_(Category.id == data.category_id, Category.is_active == True)
        )
        cat_res = await db.execute(cat_stmt)
        category = cat_res.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected category does not exist or is inactive.",
            )

        # Validate images count
        if not data.images or len(data.images) > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A listing must have between 1 and 5 photos.",
            )

        now = datetime.now(timezone.utc)
        new_listing = Listing(
            seller_id=seller.id,
            college_id=seller.college_id,
            category_id=category.id,
            title=data.title.strip(),
            description=data.description.strip(),
            price=data.price,
            original_price=data.original_price,
            condition=data.condition,
            brand=data.brand.strip() if data.brand else None,
            status=data.status,
            published_at=now if data.status == "active" else None,
        )
        db.add(new_listing)
        await db.flush()

        for idx, img in enumerate(data.images):
            listing_img = ListingImage(
                listing_id=new_listing.id,
                image_url=img.image_url,
                cloudinary_public_id=img.cloudinary_public_id,
                display_order=img.display_order if img.display_order is not None else idx,
            )
            db.add(listing_img)

        await db.commit()
        return await ListingService.get_listing_by_id(db, new_listing.id)

    @staticmethod
    async def get_listing_by_id(
        db: AsyncSession, listing_id: uuid.UUID
    ) -> Optional[Listing]:
        """Fetch full listing with preloaded relations."""
        stmt = (
            select(Listing)
            .where(Listing.id == listing_id)
            .options(
                selectinload(Listing.images),
                selectinload(Listing.category),
                selectinload(Listing.college),
                selectinload(Listing.seller).selectinload(User.profile),
                selectinload(Listing.seller).selectinload(User.college),
            )
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def get_seller_listings(
        db: AsyncSession, seller_id: uuid.UUID, status_filter: Optional[str] = None
    ) -> List[Listing]:
        """Fetch listings owned by seller, optionally filtered by status."""
        stmt = (
            select(Listing)
            .where(Listing.seller_id == seller_id)
            .options(
                selectinload(Listing.images),
                selectinload(Listing.category),
                selectinload(Listing.college),
            )
            .order_by(desc(Listing.created_at))
        )
        if status_filter and status_filter != "all":
            stmt = stmt.where(Listing.status == status_filter)

        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def update_listing(
        db: AsyncSession, seller: User, listing_id: uuid.UUID, data: ListingUpdate
    ) -> Listing:
        """Update listing owned by seller."""
        listing = await ListingService.get_listing_by_id(db, listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found.")

        if listing.seller_id != seller.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this listing.",
            )

        if listing.status in ("sold", "reserved"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot edit listing with active reservation or sold state ({listing.status}).",
            )

        if data.category_id:
            cat_stmt = select(Category).where(Category.id == data.category_id)
            cat_res = await db.execute(cat_stmt)
            if not cat_res.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Invalid category ID.")
            listing.category_id = data.category_id

        if data.title is not None:
            listing.title = data.title.strip()
        if data.description is not None:
            listing.description = data.description.strip()
        if data.price is not None:
            listing.price = data.price
        if data.original_price is not None:
            listing.original_price = data.original_price
        if data.condition is not None:
            listing.condition = data.condition
        if data.brand is not None:
            listing.brand = data.brand.strip()

        if data.images is not None:
            # Replace images
            for existing_img in list(listing.images):
                await db.delete(existing_img)
            for idx, img in enumerate(data.images):
                new_img = ListingImage(
                    listing_id=listing.id,
                    image_url=img.image_url,
                    cloudinary_public_id=img.cloudinary_public_id,
                    display_order=img.display_order if img.display_order is not None else idx,
                )
                db.add(new_img)

        await db.commit()
        return await ListingService.get_listing_by_id(db, listing.id)

    @staticmethod
    async def publish_listing(
        db: AsyncSession, seller_id: uuid.UUID, listing_id: uuid.UUID
    ) -> Listing:
        """Publish draft listing to active marketplace."""
        listing = await ListingService.get_listing_by_id(db, listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found.")
        if listing.seller_id != seller_id:
            raise HTTPException(status_code=403, detail="Forbidden.")

        listing.status = "active"
        listing.published_at = datetime.now(timezone.utc)
        await db.commit()
        return listing

    @staticmethod
    async def archive_listing(
        db: AsyncSession, seller_id: uuid.UUID, listing_id: uuid.UUID
    ) -> Listing:
        """Archive listing so it is hidden from marketplace discovery."""
        listing = await ListingService.get_listing_by_id(db, listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found.")
        if listing.seller_id != seller_id:
            raise HTTPException(status_code=403, detail="Forbidden.")

        listing.status = "archived"
        await db.commit()
        return listing

    @staticmethod
    async def delete_draft(
        db: AsyncSession, seller_id: uuid.UUID, listing_id: uuid.UUID
    ) -> bool:
        """Delete draft listing."""
        listing = await ListingService.get_listing_by_id(db, listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found.")
        if listing.seller_id != seller_id:
            raise HTTPException(status_code=403, detail="Forbidden.")
        if listing.status != "draft":
            raise HTTPException(
                status_code=400,
                detail="Only draft listings can be permanently deleted. Use archive instead.",
            )

        await db.delete(listing)
        await db.commit()
        return True

    @staticmethod
    async def search_marketplace(
        db: AsyncSession,
        college_id: Optional[uuid.UUID] = None,
        category_slug: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        condition: Optional[str] = None,
        query: Optional[str] = None,
        sort: str = "recent",
        page: int = 1,
        limit: int = 12,
    ) -> PaginatedListingsResponse:
        """Public faceted search for active campus listings."""
        conditions = [Listing.status == "active"]

        if college_id:
            conditions.append(Listing.college_id == college_id)

        if category_slug and category_slug != "all":
            cat_stmt = select(Category.id).where(Category.slug == category_slug)
            cat_res = await db.execute(cat_stmt)
            cat_id = cat_res.scalar_one_or_none()
            if cat_id:
                conditions.append(Listing.category_id == cat_id)

        if min_price is not None:
            conditions.append(Listing.price >= min_price)
        if max_price is not None:
            conditions.append(Listing.price <= max_price)

        if condition and condition != "all":
            conditions.append(Listing.condition == condition)

        if query and query.strip():
            term = f"%{query.strip()}%"
            conditions.append(
                or_(Listing.title.ilike(term), Listing.description.ilike(term))
            )

        # Count total
        count_stmt = select(func.count(Listing.id)).where(and_(*conditions))
        total_count = (await db.execute(count_stmt)).scalar() or 0

        # Build order
        if sort == "price_asc":
            order_clause = asc(Listing.price)
        elif sort == "price_desc":
            order_clause = desc(Listing.price)
        else:
            order_clause = desc(Listing.created_at)

        # Paged items
        offset = (page - 1) * limit
        stmt = (
            select(Listing)
            .where(and_(*conditions))
            .options(
                selectinload(Listing.images),
                selectinload(Listing.category),
                selectinload(Listing.college),
                selectinload(Listing.seller).selectinload(User.profile),
            )
            .order_by(order_clause)
            .offset(offset)
            .limit(limit)
        )
        res = await db.execute(stmt)
        listings = res.scalars().all()

        items: List[ListingSummaryOut] = []
        for l in listings:
            primary_img = l.images[0].image_url if l.images else None
            seller_name = (
                l.seller.profile.full_name
                if l.seller and l.seller.profile
                else "Student"
            )
            items.append(
                ListingSummaryOut(
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
            )

        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

        return PaginatedListingsResponse(
            items=items,
            total=total_count,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    @staticmethod
    def format_listing_detail(listing: Listing) -> ListingDetailOut:
        """Format ORM model into typed detail schema."""
        category_out = CategoryOut.model_validate(listing.category)
        college_out = CollegeOut.model_validate(listing.college)

        profile_out = (
            StudentProfileOut.model_validate(listing.seller.profile)
            if listing.seller and listing.seller.profile
            else None
        )
        seller_out = PublicUserOut(
            id=listing.seller.id,
            college_name=listing.college.name,
            campus_name=listing.college.campus_name,
            is_email_verified=listing.seller.is_email_verified,
            profile=profile_out,
        )

        images_out = [
            ListingImageOut.model_validate(img) for img in listing.images
        ]

        return ListingDetailOut(
            id=listing.id,
            seller_id=listing.seller_id,
            college_id=listing.college_id,
            category_id=listing.category_id,
            title=listing.title,
            description=listing.description,
            price=listing.price,
            original_price=listing.original_price,
            condition=listing.condition,
            brand=listing.brand,
            status=listing.status,
            created_at=listing.created_at,
            updated_at=listing.updated_at,
            published_at=listing.published_at,
            category=category_out,
            college=college_out,
            seller=seller_out,
            images=images_out,
        )
