"""add_view_count_to_listings

Revision ID: 28fd3bae603e
Revises: a0f921f5576c
Create Date: 2026-10-31 23:08:45.472627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '28fd3bae603e'
down_revision: Union[str, Sequence[str], None] = 'a0f921f5576c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('listings', sa.Column('view_count', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('listings', 'view_count')
