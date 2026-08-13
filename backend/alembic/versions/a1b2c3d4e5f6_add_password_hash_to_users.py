"""add password_hash to users

Revision ID: a1b2c3d4e5f6
Revises: 8f12c1861eb0
Create Date: 2026-08-13 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "8f12c1861eb0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add nullable password_hash so existing users remain valid."""
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    """Remove password_hash from users."""
    op.drop_column("users", "password_hash")
