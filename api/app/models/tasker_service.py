import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class TaskerService(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A fixed-price service a tasker lists in their profile (JustDial-style).

    A user can request one of these directly, which creates a fixed-price task
    invited to this tasker.
    """

    __tablename__ = "tasker_services"

    tasker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), index=True, nullable=False
    )

    title: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)  # fixed, INR
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )

    category: Mapped["Category"] = relationship("Category", lazy="joined")  # noqa: F821
    tasker: Mapped["User"] = relationship("User", lazy="joined")  # noqa: F821
