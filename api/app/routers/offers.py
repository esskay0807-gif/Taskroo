import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.db import get_db
from app.models.enums import OfferStatus, TaskStatus
from app.models.offer import Offer
from app.models.task import Task
from app.schemas.offer import OfferCreate, OfferOut
from app.services import offer_service, task_service
from app.services.user_service import upsert_user_from_principal

router = APIRouter(tags=["offers"])


def _task_or_404(db: Session, task_id: uuid.UUID) -> Task:
    task = task_service.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def _offer_or_404(db: Session, offer_id: uuid.UUID) -> Offer:
    offer = offer_service.get_offer(db, offer_id)
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return offer


@router.post(
    "/tasks/{task_id}/offers",
    response_model=OfferOut,
    status_code=status.HTTP_201_CREATED,
)
def create_offer(
    task_id: uuid.UUID,
    payload: OfferCreate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OfferOut:
    me = upsert_user_from_principal(db, principal)
    task = _task_or_404(db, task_id)

    if task.poster_id == me.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot offer on your own task",
        )
    if task.status != TaskStatus.open:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task is not open for offers",
        )
    if offer_service.has_pending_offer(db, task.id, me.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending offer on this task",
        )

    try:
        offer = offer_service.create_offer(db, task, me, payload.amount, payload.message)
    except IntegrityError:
        # Race against the partial unique index (one pending offer per task/tasker).
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending offer on this task",
        )
    return OfferOut.model_validate(offer)


@router.get("/tasks/{task_id}/offers", response_model=list[OfferOut])
def list_task_offers(
    task_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OfferOut]:
    me = upsert_user_from_principal(db, principal)
    task = _task_or_404(db, task_id)
    if task.poster_id != me.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the poster can view offers",
        )
    offers = offer_service.list_offers_for_task(db, task.id)
    return [OfferOut.model_validate(o) for o in offers]


@router.post("/offers/{offer_id}/accept", response_model=OfferOut)
def accept_offer(
    offer_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OfferOut:
    me = upsert_user_from_principal(db, principal)
    offer = _offer_or_404(db, offer_id)
    task = _task_or_404(db, offer.task_id)

    if task.poster_id != me.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the poster can accept offers",
        )
    if task.status != TaskStatus.open:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task is not open (an offer may already be accepted)",
        )
    if offer.status != OfferStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Offer is no longer pending",
        )

    offer = offer_service.accept_offer(db, task, offer)
    return OfferOut.model_validate(offer)


@router.post("/offers/{offer_id}/withdraw", response_model=OfferOut)
def withdraw_offer(
    offer_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OfferOut:
    me = upsert_user_from_principal(db, principal)
    offer = _offer_or_404(db, offer_id)

    if offer.tasker_id != me.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only withdraw your own offer",
        )
    if offer.status != OfferStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending offers can be withdrawn",
        )

    offer = offer_service.withdraw_offer(db, offer)
    return OfferOut.model_validate(offer)
