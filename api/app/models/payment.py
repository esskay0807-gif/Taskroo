import uuid

from sqlalchemy import (
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import PaymentStatus

payment_status_enum = SAEnum(
    PaymentStatus, native_enum=False, length=20, name="payment_status"
)


class Payment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Escrow payment for a task: authorize (hold) → capture (release minus fee).

    One payment per task. Amounts are whole INR (Razorpay is called in paise).
    No custom wallet/ledger — authorize/capture only.
    """

    __tablename__ = "payments"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    payer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    payee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )

    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False, default="INR")
    status: Mapped[PaymentStatus] = mapped_column(
        payment_status_enum, nullable=False, default=PaymentStatus.authorized, index=True
    )

    provider: Mapped[str] = mapped_column(String, nullable=False, default="razorpay")
    provider_order_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    provider_payment_id: Mapped[str | None] = mapped_column(String, nullable=True)

    # Set at release.
    fee_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    net_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)

    task: Mapped["Task"] = relationship("Task", lazy="joined")  # noqa: F821
    payer: Mapped["User"] = relationship(  # noqa: F821
        "User", lazy="joined", foreign_keys=[payer_id]
    )
    payee: Mapped["User"] = relationship(  # noqa: F821
        "User", lazy="joined", foreign_keys=[payee_id]
    )
