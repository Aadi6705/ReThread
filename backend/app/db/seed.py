import asyncio
import logging
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.college import College
from app.models.category import Category
from app.models.user import User
from app.models.profile import StudentProfile
from app.models.listing import Listing, ListingImage
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rethread.seed")

SEED_COLLEGES = [
    {
        "name": "Indian Institute of Technology Delhi",
        "email_domain": "iitd.ac.in",
        "campus_name": "Hauz Khas Campus",
        "location": "New Delhi, Delhi",
    },
    {
        "name": "Birla Institute of Technology and Science, Pilani",
        "email_domain": "bits-pilani.ac.in",
        "campus_name": "Pilani Campus",
        "location": "Pilani, Rajasthan",
    },
    {
        "name": "University of Delhi",
        "email_domain": "du.ac.in",
        "campus_name": "North Campus",
        "location": "Delhi",
    },
    {
        "name": "Generic Campus Demo",
        "email_domain": "campus.edu",
        "campus_name": "Main Campus",
        "location": "Bengaluru, Karnataka",
    },
]

SEED_CATEGORIES = [
    {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Calculators, laptops, headphones, monitors & chargers",
        "icon": "Laptop",
    },
    {
        "name": "Books & Notes",
        "slug": "books",
        "description": "Engineering textbooks, semester notes & competitive exam prep",
        "icon": "BookOpen",
    },
    {
        "name": "Apparel & Thrift",
        "slug": "apparel",
        "description": "College hoodies, jackets, casual wear & vintage thrift",
        "icon": "Shirt",
    },
    {
        "name": "Footwear",
        "slug": "footwear",
        "description": "Sneakers, boots, athletic shoes & formal wear",
        "icon": "Footprints",
    },
    {
        "name": "Dorm & Furniture",
        "slug": "furniture",
        "description": "Desks, study lamps, mattress toppers, chairs & storage racks",
        "icon": "Armchair",
    },
    {
        "name": "Sports & Fitness",
        "slug": "sports",
        "description": "Badminton racquets, footballs, yoga mats & gym gear",
        "icon": "Dumbbell",
    },
    {
        "name": "Accessories",
        "slug": "accessories",
        "description": "Backpacks, tote bags, watches & sunglasses",
        "icon": "Watch",
    },
    {
        "name": "Other",
        "slug": "other",
        "description": "Miscellaneous campus essentials and items",
        "icon": "Layers",
    },
]

SAMPLE_LISTINGS = [
    {
        "title": "Casio FX-991EX ClassWiz Scientific Calculator",
        "category_slug": "electronics",
        "description": "High-resolution solar scientific calculator with 552 functions. Essential for 1st & 2nd year engineering mathematics and physics courses. Like new, barely used for one semester with original case.",
        "price": Decimal("950.00"),
        "original_price": Decimal("1495.00"),
        "condition": "like_new",
        "brand": "Casio",
        "images": [
            "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80",
        ],
    },
    {
        "title": "Concepts of Physics by H.C. Verma (Vol 1 & 2 Combo)",
        "category_slug": "books",
        "description": "Complete 2-volume HC Verma set. Clean pages with minimal pencil annotations. Perfect for core physics foundation and competitive preparation. Both volumes included.",
        "price": Decimal("550.00"),
        "original_price": Decimal("980.00"),
        "condition": "good",
        "brand": "Bharati Bhawan",
        "images": [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
        ],
    },
    {
        "title": "Vintage Collegiate Heavyweight Forest Green Hoodie",
        "category_slug": "apparel",
        "description": "Thrifted oversized 450 GSM pure cotton hoodie in deep forest green. Fits Men's L or oversized M. Extremely warm for Delhi campus winters. Soft fleece lining with zero tears or stains.",
        "price": Decimal("850.00"),
        "original_price": Decimal("2400.00"),
        "condition": "excellent",
        "brand": "Vintage Thrift",
        "images": [
            "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
        ],
    },
    {
        "title": "Sony WH-CH520 Wireless Bluetooth Headphones",
        "category_slug": "electronics",
        "description": "Beige colorway with 50-hour battery life and multipoint Bluetooth connection. Perfect for library study sessions. Original charging cable included.",
        "price": Decimal("2600.00"),
        "original_price": Decimal("4490.00"),
        "condition": "like_new",
        "brand": "Sony",
        "images": [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
        ],
    },
    {
        "title": "Minimalist Solid Pine Wood Study Desk & LED Lamp",
        "category_slug": "furniture",
        "description": "Compact solid pine wood desk built specifically for hostel rooms. Dimensions 3.5 ft x 2 ft. Easily detachable legs for transport across campus hostels. Includes 3-mode LED study lamp.",
        "price": Decimal("1800.00"),
        "original_price": Decimal("3800.00"),
        "condition": "good",
        "brand": "Hostel Made",
        "images": [
            "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80",
        ],
    },
    {
        "title": "Yonex Astrox 77 Badminton Racquet (Strung)",
        "category_slug": "sports",
        "description": "Genuine Yonex Astrox 77 graphite badminton racquet strung with BG65 at 24 lbs tension. Ideal for university sports complex matches. Grip replaced last month.",
        "price": Decimal("1950.00"),
        "original_price": Decimal("3600.00"),
        "condition": "excellent",
        "brand": "Yonex",
        "images": [
            "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80",
        ],
    },
    {
        "title": "Nike Air Max Terrascape 90 Sneakers (UK 9)",
        "category_slug": "footwear",
        "description": "Authentic Nike Air Max sneakers in neutral off-white/sage colorway. Worn handful of times on campus, tread is in near-mint condition with original box.",
        "price": Decimal("3800.00"),
        "original_price": Decimal("8995.00"),
        "condition": "like_new",
        "brand": "Nike",
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
        ],
    },
    {
        "title": "Fjällräven Kånken Classic Water-Resistant Backpack",
        "category_slug": "accessories",
        "description": "Classic 16L durable Vinylon backpack in Ox Red. Fits up to 13-inch laptop, notebooks, and water bottle. Clean condition, perfect for carrying notes across lecture halls.",
        "price": Decimal("1450.00"),
        "original_price": Decimal("3500.00"),
        "condition": "good",
        "brand": "Fjällräven",
        "images": [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
        ],
    },
]


async def seed_data():
    async with AsyncSessionLocal() as session:
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
                logger.info(f"Seeded College: {col_data['name']}")
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
                logger.info(f"Seeded Category: {cat_data['name']}")
            categories[cat_data["slug"]] = cat

        # 3. Seed Demo Verified Seller Student
        demo_college = colleges.get("iitd.ac.in")
        seller_email = "rohit.mehta@iitd.ac.in"
        stmt = select(User).where(User.email == seller_email)
        res = await session.execute(stmt)
        seller = res.scalar_one_or_none()
        if not seller:
            seller = User(
                college_id=demo_college.id,
                email=seller_email,
                password_hash=get_password_hash("CampusPass123!"),
                is_email_verified=True,
                account_status="active",
            )
            session.add(seller)
            await session.flush()

            profile = StudentProfile(
                user_id=seller.id,
                full_name="Rohit Mehta",
                department="Mechanical Engineering",
                course="B.Tech",
                academic_year="Final Year",
                bio="Graduating senior clearing out hostel gear and semester textbooks. Reliable campus meetups at SAC or Nilgiri hostel.",
            )
            session.add(profile)
            await session.flush()
            logger.info("Seeded Demo Seller: Rohit Mehta (IIT Delhi)")

        # 4. Seed Sample Listings
        now = datetime.now(timezone.utc)
        for item in SAMPLE_LISTINGS:
            cat = categories.get(item["category_slug"])
            if not cat:
                continue

            stmt = select(Listing).where(Listing.title == item["title"])
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                listing = Listing(
                    seller_id=seller.id,
                    college_id=demo_college.id,
                    category_id=cat.id,
                    title=item["title"],
                    description=item["description"],
                    price=item["price"],
                    original_price=item["original_price"],
                    condition=item["condition"],
                    brand=item["brand"],
                    status="active",
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

                logger.info(f"Seeded Listing: {item['title']} (₹ {item['price']})")

        await session.commit()
        logger.info("Marketplace seed completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_data())
