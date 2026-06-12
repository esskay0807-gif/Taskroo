import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import InviteStatus, OfferStatus, TaskStatus
from app.models.invite import TaskInvite
from app.models.offer import Offer
from app.models.task import Task
from app.services import conversation_service


def list_for_task(db: Session, task_id: uuid.UUID) -> list[TaskInvite]:
    stmt = (
        select(TaskInvite)
        .where(TaskInvite.task_id == task_id)
        .order_by(TaskInvite.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def list_my_invites(db: Session, tasker_id: uuid.UUID) -> list[TaskInvite]:
    stmt = (
        select(TaskInvite)
        .where(TaskInvite.tasker_id == tasker_id)
        .order_by(TaskInvite.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def get(db: Session, invite_id: uuid.UUID) -> TaskInvite | None:
    return db.get(TaskInvite, invite_id)


def _existing_tasker_ids(db: Session, task_id: uuid.UUID) -> set[uuid.UUID]:
    rows = db.execute(
        select(TaskInvite.tasker_id).where(TaskInvite.task_id == task_id)
    ).scalars().all()
    return set(rows)


def create_invites(
    db: Session, task: Task, tasker_ids: list[uuid.UUID]
) -> list[TaskInvite]:
    """Create invites for the given taskers, skipping the poster and any already invited."""
    existing = _existing_tasker_ids(db, task.id)
    created: list[TaskInvite] = []
    for tid in dict.fromkeys(tasker_ids):  # dedupe, keep order
        if tid == task.poster_id or tid in existing:
            continue
        invite = TaskInvite(task_id=task.id, tasker_id=tid, status=InviteStatus.pending)
        db.add(invite)
        created.append(invite)
    db.commit()
    for inv in created:
        db.refresh(inv)
    return created


def accept_invite(db: Session, invite: TaskInvite, task: Task) -> TaskInvite:
    """Tasker accepts: assign the task to them at the budget cap, cancel other pending
    invites, reject pending offers, and open a conversation. Caller verifies invitee +
    task open + invite pending."""
    invite.status = InviteStatus.accepted

    task.status = TaskStatus.assigned
    task.assigned_tasker_id = invite.tasker_id
    task.agreed_amount = task.budget_max

    # Cancel other pending invites on this task.
    for other in list_for_task(db, task.id):
        if other.id != invite.id and other.status == InviteStatus.pending:
            other.status = InviteStatus.cancelled

    # Reject any pending offers on this task.
    offers = db.execute(
        select(Offer).where(
            Offer.task_id == task.id, Offer.status == OfferStatus.pending
        )
    ).scalars().all()
    for offer in offers:
        offer.status = OfferStatus.rejected

    db.commit()

    # Ensure a conversation exists between poster and the accepting tasker.
    conversation_service.get_or_create_conversation(db, task, invite.tasker)
    db.refresh(invite)
    return invite


def decline_invite(db: Session, invite: TaskInvite) -> TaskInvite:
    invite.status = InviteStatus.declined
    db.commit()
    db.refresh(invite)
    return invite
