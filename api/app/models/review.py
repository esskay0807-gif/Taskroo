import uuid

from sqlalchemy import (
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ReviewRole

review_role_enum = SAEnum(ReviewRole, native_enum=False, length=20, name="review_role")


class Review(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A review one party leaves about the other after a task is completed.

    At most one review per (task, reviewer).
    """

    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("task_id", "reviewer_id", name="uq_review_task_reviewer"),
    )

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    reviewee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )

    role: Mapped[ReviewRole] = mapped_column(review_role_enum, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    reviewer: Mapped["User"] = relationship(  # noqa: F821
        "User", lazy="joined", foreign_keys=[reviewer_id]
    )
    reviewee: Mapped["User"] = relationship(  # noqa: F821
        "User", lazy="joined", foreign_keys=[reviewee_id]
    )
    photos: Mapped[list["ReviewPhoto"]] = relationship(
        "ReviewPhoto",
        back_populates="review",
        cascade="all, delete-orphan",
        order_by="ReviewPhoto.sort_order",
        lazy="selectin",
    )


class ReviewPhoto(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "review_photos"

    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), index=True, nullable=False
    )
    url: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    review: Mapped["Review"] = relationship("Review", back_populates="photos")
