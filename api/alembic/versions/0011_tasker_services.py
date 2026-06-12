"""create tasker_services + tasks.is_direct_request

Revision ID: 0011
Revises: 0010
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("is_direct_request", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.create_table(
        "tasker_services",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tasker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tasker_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tasker_services_tasker_id"), "tasker_services", ["tasker_id"])
    op.create_index(op.f("ix_tasker_services_category_id"), "tasker_services", ["category_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_tasker_services_category_id"), table_name="tasker_services")
    op.drop_index(op.f("ix_tasker_services_tasker_id"), table_name="tasker_services")
    op.drop_table("tasker_services")
    op.drop_column("tasks", "is_direct_request")
