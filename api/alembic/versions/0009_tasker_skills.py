"""add tasker availability + skills (tasker_categories)

Revision ID: 0009
Revises: 0008
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "tasker_categories",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "category_id"),
    )
    op.create_index(op.f("ix_tasker_categories_user_id"), "tasker_categories", ["user_id"])
    op.create_index(op.f("ix_tasker_categories_category_id"), "tasker_categories", ["category_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_tasker_categories_category_id"), table_name="tasker_categories")
    op.drop_index(op.f("ix_tasker_categories_user_id"), table_name="tasker_categories")
    op.drop_table("tasker_categories")
    op.drop_column("users", "is_available")
