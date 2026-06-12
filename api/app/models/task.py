import uuid

from sqlalchemy import (
    Boolean,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import LocationType, TaskStatus

# VARCHAR + CHECK constraint enums (native_enum=False) — friendlier with Alembic than
# native Postgres enum types.
task_status_enum = SAEnum(TaskStatus, native_enum=False, length=20, name="task_status")
location_type_enum = SAEnum(LocationType, native_enum=False, length=20, name="location_type")


class Task(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A task posted by a user. M2: post + browse only."""

    __tablename__ = "tasks"

    poster_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), index=True, nullable=False
    )

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[TaskStatus] = mapped_column(
        task_status_enum, nullable=False, default=TaskStatus.open, index=True
    )
    location_type: Mapped[LocationType] = mapped_column(location_type_enum, nullable=False)

    # Location (only meaningful for in_person tasks).
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Budget range, in whole INR.
    budget_min: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_max: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False, default="INR")

    # True for a direct fixed-price service request to one tasker — kept off the
    # public browse board.
    is_direct_request: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    # Assignment (set when the poster accepts an offer — M3).
    assigned_tasker_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    agreed_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)

    poster: Mapped["User"] = relationship(
        "User", lazy="joined", foreign_keys=[poster_id]
    )  # noqa: F821
    assigned_tasker: Mapped["User | None"] = relationship(
        "User", lazy="joined", foreign_keys=[assigned_tasker_id]
    )  # noqa: F821
    category: Mapped["Category"] = relationship("Category", lazy="joined")  # noqa: F821
    photos: Mapped[list["TaskPhoto"]] = relationship(
        "TaskPhoto",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="TaskPhoto.sort_order",
        lazy="selectin",
    )
    offers: Mapped[list["Offer"]] = relationship(  # noqa: F821
        "Offer",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class TaskPhoto(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "task_photos"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), index=True, nullable=False
    )
    url: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    task: Mapped["Task"] = relationship("Task", back_populates="photos")
