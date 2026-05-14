"""add owner role

Revision ID: a3f1c2d4e5b6
Revises: 19ca16ed5946
Create Date: 2025-01-02 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

revision: str = "a3f1c2d4e5b6"
down_revision: Union[str, None] = "19ca16ed5946"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE projectrole ADD VALUE IF NOT EXISTS 'OWNER'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating the type.
    # Downgrade is intentionally a no-op — removing OWNER would require a full
    # type recreation and data migration, which is not safe to automate.
    pass
