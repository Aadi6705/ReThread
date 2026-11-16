"""sync_listings_college_and_seller

Revision ID: a1e2f3d4c5b6
Revises: 959a3635228a
Create Date: 2026-11-16 14:22:00.000000

"""
from typing import Sequence, Union
from alembic import op
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = 'a1e2f3d4c5b6'
down_revision: Union[str, Sequence[str], None] = '959a3635228a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Ensure Aditya's accounts are assigned to Main Campus
    conn.execute(
        text(
            """
            UPDATE users
            SET college_id = 'a0000000-0000-0000-0000-000000000004'
            WHERE email IN ('aditya@gmail.com', 'aadi@gmail.com');
            """
        )
    )

    # 2. Synchronize all listings to match their seller's college_id
    conn.execute(
        text(
            """
            UPDATE listings
            SET college_id = users.college_id
            FROM users
            WHERE listings.seller_id = users.id AND users.college_id IS NOT NULL;
            """
        )
    )

    # 3. Ensure the 7 predefined listings are explicitly active
    conn.execute(
        text(
            """
            UPDATE listings
            SET status = 'active'
            WHERE id IN (
                'c1000000-0000-0000-0000-000000000001',
                'c1000000-0000-0000-0000-000000000002',
                'c1000000-0000-0000-0000-000000000003',
                'c1000000-0000-0000-0000-000000000004',
                'c1000000-0000-0000-0000-000000000005',
                'c1000000-0000-0000-0000-000000000006',
                'c1000000-0000-0000-0000-000000000007'
            );
            """
        )
    )


def downgrade() -> None:
    pass

