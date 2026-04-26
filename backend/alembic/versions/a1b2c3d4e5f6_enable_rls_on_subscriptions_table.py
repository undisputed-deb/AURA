"""enable_rls_on_subscriptions_table

Revision ID: a1b2c3d4e5f6
Revises: 15f3d915565c
Create Date: 2026-04-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '15f3d915565c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;')
    # Block all access via the anon/public key; backend uses a direct DB role
    # that bypasses RLS so this does not affect the API.
    op.execute("""
        CREATE POLICY subscriptions_deny_public
        ON subscriptions
        FOR ALL
        TO public
        USING (false);
    """)


def downgrade() -> None:
    op.execute('DROP POLICY IF EXISTS subscriptions_deny_public ON subscriptions;')
    op.execute('ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;')
