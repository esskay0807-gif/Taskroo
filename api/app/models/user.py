from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Table, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

# Skills a tasker offers (many-to-many between users and categories).
tasker_categories = Table(
    "tasker_categories",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A platform user, mirrored from Clerk on first authenticated request.

    M1 adds profile, role, verification, and rating fields. Verification flags and
    rating fields are server-managed (not client-editable) — ratings are wired up
    for real in M6 and are placeholders here.
    """

    __tablename__ = "users"

    # Clerk subject (`sub` claim) — the stable external identity.
    clerk_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)

    # Profile
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    bio: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Roles — one account can act as both Poster and Tasker.
    is_poster: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    is_tasker: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    # Verification (display-only placeholders for M1).
    phone_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    id_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    # Ratings / trust signals (server-managed; computed for real in M6).
    rating_avg: Mapped[float] = mapped_column(
        Float, nullable=False, server_default=text("0")
    )
    rating_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    completion_rate: Mapped[float] = mapped_column(
        Float, nullable=False, server_default=text("0")
    )

    # Tasker availability + skills (for recommendations / invites).
    is_available: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    categories: Mapped[list["Category"]] = relationship(  # noqa: F821
        "Category", secondary=tasker_categories, lazy="selectin", order_by="Category.name"
    )
