"""enable_rls_on_all_tables

Revision ID: 8607ca100a3c
Revises: 7056f58880e7
Create Date: 2025-12-16 22:49:38.801114

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8607ca100a3c'
down_revision: Union[str, None] = '7056f58880e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable RLS on all public tables
    op.execute('ALTER TABLE users ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE questions ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE answers ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE alembic_version ENABLE ROW LEVEL SECURITY;')


def downgrade() -> None:
    # Disable RLS on all public tables
    op.execute('ALTER TABLE users DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE resumes DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE questions DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE answers DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE alembic_version DISABLE ROW LEVEL SECURITY;')
