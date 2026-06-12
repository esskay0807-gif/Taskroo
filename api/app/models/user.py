from sqlalchemy import Boolean, Float, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


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
