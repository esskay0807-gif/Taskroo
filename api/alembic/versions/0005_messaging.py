"""create conversations and messages; backfill from offers

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("poster_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tasker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["poster_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["tasker_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", "tasker_id", name="uq_conversation_task_tasker"),
    )
    op.create_index(op.f("ix_conversations_task_id"), "conversations", ["task_id"])
    op.create_index(op.f("ix_conversations_poster_id"), "conversations", ["poster_id"])
    op.create_index(op.f("ix_conversations_tasker_id"), "conversations", ["tasker_id"])

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_messages_conversation_created",
        "messages",
        ["conversation_id", "created_at"],
    )

    # Backfill a conversation for each existing (task, tasker) offer pair.
    op.execute(
        """
        INSERT INTO conversations (id, task_id, poster_id, tasker_id, created_at, updated_at)
        SELECT gen_random_uuid(), o.task_id, t.poster_id, o.tasker_id, now(), now()
        FROM (SELECT DISTINCT task_id, tasker_id FROM offers) o
        JOIN tasks t ON t.id = o.task_id
        """
    )


def downgrade() -> None:
    op.drop_index("ix_messages_conversation_created", table_name="messages")
    op.drop_table("messages")
    op.drop_index(op.f("ix_conversations_tasker_id"), table_name="conversations")
    op.drop_index(op.f("ix_conversations_poster_id"), table_name="conversations")
    op.drop_index(op.f("ix_conversations_task_id"), table_name="conversations")
    op.drop_table("conversations")
