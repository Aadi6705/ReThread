"""seed_aditya_predefined_listings

Revision ID: 959a3635228a
Revises: 52f26f9c2e0b
Create Date: 2026-11-16 13:27:45.171712

"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = '959a3635228a'
down_revision: Union[str, Sequence[str], None] = '52f26f9c2e0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Standard password hash for "Password123!"
PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$mPOec24tJQRASOkdg1AqZQ$cP7qMX0cXW5I8kD1UK/TGi/vILJDsaRkWXYi5kbe1k4"

PREDEFINED_ITEMS = [
    {
        "id": "c1000000-0000-0000-0000-000000000001",
        "category_slug": "electronics",
        "title": "Casio fx-991EX ClassWiz Scientific Calculator",
        "description": "Essential for 1st & 2nd year engineering exams (matrices, equations, numerical integration). Crisp display, solar and battery working perfectly with protective hard cover.",
        "price": Decimal("750.00"),
        "original_price": Decimal("1450.00"),
        "condition": "like_new",
        "brand": "Casio",
        "image_url": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80",
    },
    {
        "id": "c1000000-0000-0000-0000-000000000002",
        "category_slug": "apparel",
        "title": "Official Campus Winter Fleece Hoodie (Navy, Size M)",
        "description": "Super warm collegiate navy hoodie, size M. Only worn for one semester, no linting or fading. Deep kangaroo pocket and fleece lining.",
        "price": Decimal("600.00"),
        "original_price": Decimal("1399.00"),
        "condition": "excellent",
        "brand": "Campus Thrift",
        "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    },
    {
        "id": "c1000000-0000-0000-0000-000000000003",
        "category_slug": "electronics",
        "title": "Sony WH-CH520 Wireless Bluetooth Headphones",
        "description": "Matte black on-ear headphones with 50-hour battery life and custom EQ via Sony Headphones Connect. Perfect for long library study sessions.",
        "price": Decimal("1800.00"),
        "original_price": Decimal("3990.00"),
        "condition": "like_new",
        "brand": "Sony",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    },
    {
        "id": "c1000000-0000-0000-0000-000000000004",
        "category_slug": "furniture",
        "title": "Wipro 9W Smart LED Desk Study Lamp",
        "description": "3 color temperatures (warm, cool, white) with adjustable brightness touch controls and flexible gooseneck. Plugs into USB or wall socket.",
        "price": Decimal("450.00"),
        "original_price": Decimal("999.00"),
        "condition": "like_new",
        "brand": "Wipro",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    },
    {
        "id": "c1000000-0000-0000-0000-000000000005",
        "category_slug": "books",
        "title": "Higher Engineering Mathematics by B.S. Grewal (44th Edition)",
        "description": "Must-have textbook for Engineering Mathematics 1 & 2. Includes solved university exam papers and handwritten reference formulas in the margins.",
        "price": Decimal("350.00"),
        "original_price": Decimal("850.00"),
        "condition": "good",
        "brand": "Khanna Publishers",
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    },
    {
        "id": "c1000000-0000-0000-0000-000000000006",
        "category_slug": "sports",
        "title": "Yonex Muscle Power 29 Light Badminton Racquet",
        "description": "Even-balance graphite racquet strung at 24 lbs with fresh BG65 string and brand new anti-slip overgrip. Ideal for campus sports complex matches.",
        "price": Decimal("950.00"),
        "original_price": Decimal("2200.00"),
        "condition": "excellent",
        "brand": "Yonex",
        "image_url": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
    },
    {
        "id": "c1000000-0000-0000-0000-000000000007",
        "category_slug": "accessories",
        "title": "Wildcraft 35L Campus Laptop Backpack",
        "description": "Padded 15.6 inch laptop sleeve, 3 spacious compartments, rain-resistant fabric, and side mesh bottle holders. All zips smooth and intact.",
        "price": Decimal("700.00"),
        "original_price": Decimal("1899.00"),
        "condition": "excellent",
        "brand": "Wildcraft",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    },
]


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Fetch default college
    college = conn.execute(
        text("SELECT id FROM colleges LIMIT 1")
    ).fetchone()
    if not college:
        college_id = uuid.uuid4()
        conn.execute(
            text(
                "INSERT INTO colleges (id, name, email_domain, campus_name, location, created_at) "
                "VALUES (:id, 'University Campus', 'campus.edu', 'Main Campus', 'Campus City', NOW())"
            ),
            {"id": college_id},
        )
    else:
        college_id = college[0]

    # 2. Ensure both aditya@gmail.com and aadi@gmail.com exist
    target_emails = ["aditya@gmail.com", "aadi@gmail.com"]
    seller_user_id = None

    for email in target_emails:
        user = conn.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": email},
        ).fetchone()

        if user:
            user_id = user[0]
            # Update password so user can log in with Password123!
            conn.execute(
                text("UPDATE users SET password_hash = :hash, is_email_verified = true, account_status = 'active' WHERE id = :id"),
                {"hash": PASSWORD_HASH, "id": user_id},
            )
        else:
            user_id = uuid.uuid4()
            conn.execute(
                text(
                    "INSERT INTO users (id, college_id, email, password_hash, is_email_verified, account_status, created_at, updated_at) "
                    "VALUES (:id, :college_id, :email, :hash, true, 'active', NOW(), NOW())"
                ),
                {"id": user_id, "college_id": college_id, "email": email, "hash": PASSWORD_HASH},
            )

        # Ensure student profile
        profile = conn.execute(
            text("SELECT id FROM student_profiles WHERE user_id = :user_id"),
            {"user_id": user_id},
        ).fetchone()

        if not profile:
            conn.execute(
                text(
                    "INSERT INTO student_profiles (id, user_id, full_name, department, course, academic_year, created_at, updated_at) "
                    "VALUES (:id, :user_id, 'Aditya Srivastava', 'CSBS', 'B.Tech', '1st Year', NOW(), NOW())"
                ),
                {"id": uuid.uuid4(), "user_id": user_id},
            )

        if email == "aditya@gmail.com":
            seller_user_id = user_id

    if not seller_user_id:
        seller_user_id = user_id

    # 3. Insert predefined listings
    for item in PREDEFINED_ITEMS:
        # Get category id by slug
        cat = conn.execute(
            text("SELECT id FROM categories WHERE slug = :slug"),
            {"slug": item["category_slug"]},
        ).fetchone()

        if not cat:
            cat = conn.execute(text("SELECT id FROM categories LIMIT 1")).fetchone()
        category_id = cat[0]

        # Check if listing already exists
        existing = conn.execute(
            text("SELECT id FROM listings WHERE id = :id OR title = :title"),
            {"id": item["id"], "title": item["title"]},
        ).fetchone()

        if not existing:
            listing_id = item["id"]
            conn.execute(
                text(
                    "INSERT INTO listings (id, seller_id, college_id, category_id, title, description, price, original_price, condition, brand, status, view_count, published_at, created_at, updated_at) "
                    "VALUES (:id, :seller_id, :college_id, :category_id, :title, :description, :price, :original_price, :condition, :brand, 'active', 0, NOW(), NOW(), NOW())"
                ),
                {
                    "id": listing_id,
                    "seller_id": seller_user_id,
                    "college_id": college_id,
                    "category_id": category_id,
                    "title": item["title"],
                    "description": item["description"],
                    "price": item["price"],
                    "original_price": item["original_price"],
                    "condition": item["condition"],
                    "brand": item["brand"],
                },
            )

            # Insert listing image
            conn.execute(
                text(
                    "INSERT INTO listing_images (id, listing_id, image_url, cloudinary_public_id, display_order, created_at) "
                    "VALUES (:id, :listing_id, :image_url, :pub_id, 0, NOW())"
                ),
                {
                    "id": uuid.uuid4(),
                    "listing_id": listing_id,
                    "image_url": item["image_url"],
                    "pub_id": f"seed_{uuid.uuid4().hex[:8]}",
                },
            )


def downgrade() -> None:
    pass
