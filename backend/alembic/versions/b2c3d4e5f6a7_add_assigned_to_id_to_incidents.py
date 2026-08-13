"""add assigned_to_id to incidents

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-13 16:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "incidents",
        sa.Column("assigned_to_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_incidents_assigned_to_id_users",
        "incidents",
        "users",
        ["assigned_to_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_incidents_assigned_to_id"),
        "incidents",
        ["assigned_to_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_incidents_assigned_to_id"), table_name="incidents")
    op.drop_constraint("fk_incidents_assigned_to_id_users", "incidents", type_="foreignkey")
    op.drop_column("incidents", "assigned_to_id")
