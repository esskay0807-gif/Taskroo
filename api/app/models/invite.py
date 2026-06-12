import uuid

from sqlalchemy import Enum as SAEnum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import InviteStatus

invite_status_enum = SAEnum(InviteStatus, native_enum=False, length=20, name="invite_status")


class TaskInvite(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A poster's invitation to a specific tasker to do a task (poster → tasker).

    The inverse of an Offer. At most one invite per (task, tasker).
    """

    __tablename__ = "task_invites"
    __table_args__ = (
        UniqueConstraint("task_id", "tasker_id", name="uq_invite_task_tasker"),
    )

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tasker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    status: Mapped[InviteStatus] = mapped_column(
        invite_status_enum, nullable=False, default=InviteStatus.pending, index=True
    )

    task: Mapped["Task"] = relationship("Task")  # noqa: F821
    tasker: Mapped["User"] = relationship("User", lazy="joined")  # noqa: F821
