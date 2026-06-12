import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import OfferStatus, TaskStatus
from app.models.offer import Offer
from app.models.task import Task
from app.models.user import User


def has_pending_offer(db: Session, task_id: uuid.UUID, tasker_id: uuid.UUID) -> bool:
    stmt = select(Offer.id).where(
        Offer.task_id == task_id,
        Offer.tasker_id == tasker_id,
        Offer.status == OfferStatus.pending,
    )
    return db.execute(stmt).first() is not None


def create_offer(
    db: Session, task: Task, tasker: User, amount: int, message: str | None
) -> Offer:
    offer = Offer(
        task_id=task.id,
        tasker_id=tasker.id,
        amount=amount,
        message=message,
        status=OfferStatus.pending,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


def get_offer(db: Session, offer_id: uuid.UUID) -> Offer | None:
    return db.get(Offer, offer_id)


def list_offers_for_task(db: Session, task_id: uuid.UUID) -> list[Offer]:
    stmt = (
        select(Offer)
        .where(Offer.task_id == task_id)
        .order_by(Offer.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def list_my_offers(db: Session, tasker_id: uuid.UUID) -> list[Offer]:
    stmt = (
        select(Offer)
        .where(Offer.tasker_id == tasker_id)
        .order_by(Offer.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def accept_offer(db: Session, task: Task, offer: Offer) -> Offer:
    """Accept an offer: assign the task and auto-reject all other pending offers.

    Caller must have already verified poster ownership, task.status == open, and
    offer.status == pending.
    """
    offer.status = OfferStatus.accepted

    task.status = TaskStatus.assigned
    task.assigned_tasker_id = offer.tasker_id
    task.agreed_amount = offer.amount

    for other in task.offers:
        if other.id != offer.id and other.status == OfferStatus.pending:
            other.status = OfferStatus.rejected

    db.commit()
    db.refresh(offer)
    return offer


def withdraw_offer(db: Session, offer: Offer) -> Offer:
    offer.status = OfferStatus.withdrawn
    db.commit()
    db.refresh(offer)
    return offer
