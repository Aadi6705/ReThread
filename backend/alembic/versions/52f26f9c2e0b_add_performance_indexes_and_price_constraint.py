"""add_performance_indexes_and_price_constraint

Revision ID: 52f26f9c2e0b
Revises: 41e15e8b1d9a
Create Date: 2026-11-15 20:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52f26f9c2e0b'
down_revision: Union[str, Sequence[str], None] = '41e15e8b1d9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Performance indexes for listings catalog
    op.create_index('ix_listings_status_created_at', 'listings', ['status', 'created_at'])
    op.create_index('ix_listings_status_price', 'listings', ['status', 'price'])

    # 2. Performance index for transaction listing queries
    op.create_index('ix_transactions_listing_status', 'transactions', ['listing_id', 'status'])

    # 3. Check constraint enforcing positive listing price
    op.create_check_constraint('chk_listings_price_positive', 'listings', 'price >= 0')


def downgrade() -> None:
    op.drop_constraint('chk_listings_price_positive', 'listings', type_='check')
    op.drop_index('ix_transactions_listing_status', table_name='transactions')
    op.drop_index('ix_listings_status_price', table_name='listings')
    op.drop_index('ix_listings_status_created_at', table_name='listings')
