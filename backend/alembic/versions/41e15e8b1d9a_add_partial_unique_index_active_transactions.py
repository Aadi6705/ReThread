"""add_partial_unique_index_active_transactions

Revision ID: 41e15e8b1d9a
Revises: 28fd3bae603e
Create Date: 2026-11-15 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '41e15e8b1d9a'
down_revision: Union[str, Sequence[str], None] = '28fd3bae603e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'uq_transactions_active_listing',
        'transactions',
        ['listing_id'],
        unique=True,
        postgresql_where=sa.text("status IN ('accepted', 'meetup_scheduled')")
    )


def downgrade() -> None:
    op.drop_index('uq_transactions_active_listing', table_name='transactions')

