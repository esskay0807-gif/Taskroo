"""add task assignment columns and offers table

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("assigned_tasker_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column("tasks", sa.Column("agreed_amount", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_tasks_assigned_tasker_id_users",
        "tasks",
        "users",
        ["assigned_tasker_id"],
        ["id"],
    )

    op.create_table(
        "offers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tasker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tasker_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_offers_task_id"), "offers", ["task_id"])
    op.create_index(op.f("ix_offers_tasker_id"), "offers", ["tasker_id"])
    op.create_index(op.f("ix_offers_status"), "offers", ["status"])
    # At most one pending offer per (task, tasker).
    op.create_index(
        "uq_offers_one_pending_per_tasker",
        "offers",
        ["task_id", "tasker_id"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )


def downgrade() -> None:
    op.drop_index("uq_offers_one_pending_per_tasker", table_name="offers")
    op.drop_index(op.f("ix_offers_status"), table_name="offers")
    op.drop_index(op.f("ix_offers_tasker_id"), table_name="offers")
    op.drop_index(op.f("ix_offers_task_id"), table_name="offers")
    op.drop_table("offers")
    op.drop_constraint("fk_tasks_assigned_tasker_id_users", "tasks", type_="foreignkey")
    op.drop_column("tasks", "agreed_amount")
    op.drop_column("tasks", "assigned_tasker_id")
