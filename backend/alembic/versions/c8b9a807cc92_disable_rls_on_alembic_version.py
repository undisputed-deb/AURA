"""disable_rls_on_alembic_version

Revision ID: c8b9a807cc92
Revises: 8607ca100a3c
Create Date: 2025-12-16 22:58:19.710943

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c8b9a807cc92'
down_revision: Union[str, None] = '8607ca100a3c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE alembic_version DISABLE ROW LEVEL SECURITY;')


def downgrade() -> None:
    op.execute('ALTER TABLE alembic_version ENABLE ROW LEVEL SECURITY;')
