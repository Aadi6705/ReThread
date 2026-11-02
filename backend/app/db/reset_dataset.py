import asyncio
import logging
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import text, select
from app.db.session import AsyncSessionLocal
from app.models.college import College
from app.models.category import Category
from app.models.user import User
from app.models.profile import StudentProfile
from app.models.listing import Listing, ListingImage
from app.core.security import get_password_hash
from app.db.seed import SEED_COLLEGES, SEED_CATEGORIES, SAMPLE_LISTINGS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rethread.reset")


async def reset_database():
    """Completely wipe transaction/user/listing data and re-seed clean default dataset."""
    async with AsyncSessionLocal() as session:
        logger.info("Wiping database tables...")

        # Truncate tables with cascade in PostgreSQL
        await session.execute(
            text(
                """
                TRUNCATE TABLE 
                    messages, 
                    conversation_participants, 
                    conversations, 
                    notifications, 
                    wishlists, 
                    transactions, 
                    listing_images, 
                    listings, 
                    email_verification_tokens, 
                    student_profiles, 
                    users 
                CASCADE;
                """
            )
        )
        await session.commit()
        logger.info("Database wiped cleanly.")

        # 1. Seed Colleges
        colleges = {}
        for col_data in SEED_COLLEGES:
            stmt = select(College).where(College.email_domain == col_data["email_domain"])
            res = await session.execute(stmt)
            col = res.scalar_one_or_none()
            if not col:
                col = College(**col_data)
                session.add(col)
                await session.flush()
            colleges[col_data["email_domain"]] = col

        # 2. Seed Categories
        categories = {}
        for cat_data in SEED_CATEGORIES:
            stmt = select(Category).where(Category.slug == cat_data["slug"])
            res = await session.execute(stmt)
            cat = res.scalar_one_or_none()
            if not cat:
                cat = Category(**cat_data)
                session.add(cat)
                await session.flush()
            categories[cat_data["slug"]] = cat

        logger.info("Colleges and Categories ready.")

        # 3. Seed Demo Seller (Rohit Mehta - IIT Delhi)
        iitd_college = colleges["iitd.ac.in"]
        seller = User(
            college_id=iitd_college.id,
            email="rohit.mehta@iitd.ac.in",
            password_hash=get_password_hash("CampusPass123!"),
            is_email_verified=True,
            account_status="active",
        )
        session.add(seller)
        await session.flush()

        seller_profile = StudentProfile(
            user_id=seller.id,
            full_name="Rohit Mehta",
            department="Mechanical Engineering",
            course="B.Tech",
            academic_year="Final Year",
            bio="Graduating senior clearing out hostel gear and semester textbooks. Reliable campus meetups at SAC or Nilgiri hostel.",
        )
        session.add(seller_profile)
        await session.flush()
        logger.info("Seeded Demo Seller: rohit.mehta@iitd.ac.in (Password: CampusPass123!)")

        # 4. Seed Demo Buyer (Test Student - IIT Delhi)
        buyer = User(
            college_id=iitd_college.id,
            email="test.student@iitd.ac.in",
            password_hash=get_password_hash("StrongPassword123!"),
            is_email_verified=True,
            account_status="active",
        )
        session.add(buyer)
        await session.flush()

        buyer_profile = StudentProfile(
            user_id=buyer.id,
            full_name="Aarav Sharma",
            department="Computer Science & Engineering",
            course="B.Tech",
            academic_year="3rd Year",
            bio="Student buyer exploring textbooks, electronics and campus thrift.",
        )
        session.add(buyer_profile)
        await session.flush()
        logger.info("Seeded Demo Buyer: test.student@iitd.ac.in (Password: StrongPassword123!)")

        # 5. Seed Pristine 8 Sample Listings
        now = datetime.now(timezone.utc)
        for item in SAMPLE_LISTINGS:
            cat = categories.get(item["category_slug"])
            if not cat:
                continue

            listing = Listing(
                seller_id=seller.id,
                college_id=iitd_college.id,
                category_id=cat.id,
                title=item["title"],
                description=item["description"],
                price=item["price"],
                original_price=item["original_price"],
                condition=item["condition"],
                brand=item["brand"],
                status="active",
                view_count=0,
                published_at=now,
            )
            session.add(listing)
            await session.flush()

            for idx, img_url in enumerate(item["images"]):
                img = ListingImage(
                    listing_id=listing.id,
                    image_url=img_url,
                    cloudinary_public_id=f"seed_{idx}_{listing.id.hex[:6]}",
                    display_order=idx,
                )
                session.add(img)

            logger.info(f"Seeded Listing: {item['title']} - ₹{item['price']}")

        await session.commit()
        logger.info("Dataset has been completely reset to default state!")


if __name__ == "__main__":
    asyncio.run(reset_database())
