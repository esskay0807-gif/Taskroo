"""create task_invites

Revision ID: 0010
Revises: 0009
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "task_invites",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tasker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tasker_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", "tasker_id", name="uq_invite_task_tasker"),
    )
    op.create_index(op.f("ix_task_invites_task_id"), "task_invites", ["task_id"])
    op.create_index(op.f("ix_task_invites_tasker_id"), "task_invites", ["tasker_id"])
    op.create_index(op.f("ix_task_invites_status"), "task_invites", ["status"])


def downgrade() -> None:
    op.drop_index(op.f("ix_task_invites_status"), table_name="task_invites")
    op.drop_index(op.f("ix_task_invites_tasker_id"), table_name="task_invites")
    op.drop_index(op.f("ix_task_invites_task_id"), table_name="task_invites")
    op.drop_table("task_invites")
