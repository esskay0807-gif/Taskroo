"""create payments table

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payee_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="authorized"),
        sa.Column("provider", sa.String(), nullable=False, server_default="razorpay"),
        sa.Column("provider_order_id", sa.String(), nullable=True),
        sa.Column("provider_payment_id", sa.String(), nullable=True),
        sa.Column("fee_amount", sa.Integer(), nullable=True),
        sa.Column("net_amount", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["payee_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", name="uq_payments_task_id"),
    )
    op.create_index(op.f("ix_payments_payer_id"), "payments", ["payer_id"])
    op.create_index(op.f("ix_payments_payee_id"), "payments", ["payee_id"])
    op.create_index(op.f("ix_payments_status"), "payments", ["status"])
    op.create_index(op.f("ix_payments_provider_order_id"), "payments", ["provider_order_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_payments_provider_order_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_status"), table_name="payments")
    op.drop_index(op.f("ix_payments_payee_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_payer_id"), table_name="payments")
    op.drop_table("payments")
