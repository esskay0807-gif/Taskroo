from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A platform user, mirrored from Clerk on first authenticated request.

    Intentionally minimal for M0 — later milestones add profile fields, roles,
    ratings, etc.
    """

    __tablename__ = "users"

    # Clerk subject (`sub` claim) — the stable external identity.
    clerk_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
