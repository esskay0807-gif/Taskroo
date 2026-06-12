import uuid

from sqlalchemy import (
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import OfferStatus

offer_status_enum = SAEnum(OfferStatus, native_enum=False, length=20, name="offer_status")


class Offer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A tasker's offer to do a task at a proposed price."""

    __tablename__ = "offers"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    tasker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )

    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[OfferStatus] = mapped_column(
        offer_status_enum, nullable=False, default=OfferStatus.pending, index=True
    )

    task: Mapped["Task"] = relationship("Task", back_populates="offers")  # noqa: F821
    tasker: Mapped["User"] = relationship("User", lazy="joined")  # noqa: F821
