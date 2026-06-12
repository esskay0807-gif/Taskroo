from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.db import get_db
from app.schemas.invite import MyInviteOut
from app.schemas.offer import MyOfferOut
from app.schemas.task import TaskOut
from app.schemas.user import UserOut, UserUpdate
from app.services import invite_service, offer_service, task_service
from app.services.user_service import update_user, upsert_user_from_principal

router = APIRouter(tags=["me"])


@router.get("/me", response_model=UserOut)
def read_me(
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Return the authenticated user, upserting the row on first call."""
    user = upsert_user_from_principal(db, principal)
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Edit the authenticated user's profile."""
    user = upsert_user_from_principal(db, principal)
    user = update_user(db, user, payload)
    return UserOut.model_validate(user)


@router.get("/me/tasks", response_model=list[TaskOut])
def my_tasks(
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TaskOut]:
    """Tasks I posted (all statuses, newest first)."""
    me = upsert_user_from_principal(db, principal)
    tasks = task_service.list_tasks_by_poster(db, me.id)
    return [TaskOut.model_validate(t) for t in tasks]


@router.get("/me/offers", response_model=list[MyOfferOut])
def my_offers(
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MyOfferOut]:
    """Offers I made as a tasker (newest first), each with its task."""
    me = upsert_user_from_principal(db, principal)
    offers = offer_service.list_my_offers(db, me.id)
    return [MyOfferOut.model_validate(o) for o in offers]


@router.get("/me/invites", response_model=list[MyInviteOut])
def my_invites(
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MyInviteOut]:
    """Invites I received as a tasker (newest first), each with its task."""
    me = upsert_user_from_principal(db, principal)
    invites = invite_service.list_my_invites(db, me.id)
    return [MyInviteOut.model_validate(i) for i in invites]
