"""add user profile, role, verification, and rating fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Profile
    op.add_column("users", sa.Column("name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(), nullable=True))
    op.add_column("users", sa.Column("bio", sa.String(), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(), nullable=True))
    op.add_column("users", sa.Column("lat", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("lng", sa.Float(), nullable=True))

    # Roles
    op.add_column(
        "users",
        sa.Column("is_poster", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "users",
        sa.Column("is_tasker", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    # Verification
    op.add_column(
        "users",
        sa.Column("phone_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "users",
        sa.Column("id_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    # Ratings
    op.add_column(
        "users",
        sa.Column("rating_avg", sa.Float(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "users",
        sa.Column("rating_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "users",
        sa.Column("completion_rate", sa.Float(), nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    for col in (
        "completion_rate",
        "rating_count",
        "rating_avg",
        "id_verified",
        "phone_verified",
        "is_tasker",
        "is_poster",
        "lng",
        "lat",
        "city",
        "bio",
        "avatar_url",
        "name",
    ):
        op.drop_column("users", col)
