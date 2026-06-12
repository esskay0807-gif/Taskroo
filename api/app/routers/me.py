import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.db import get_db
from app.schemas.invite import MyInviteOut
from app.schemas.offer import MyOfferOut
from app.schemas.task import TaskOut
from app.schemas.tasker_service import (
    TaskerServiceCreate,
    TaskerServiceOut,
    TaskerServiceUpdate,
)
from app.schemas.user import UserOut, UserUpdate
from app.services import (
    invite_service,
    offer_service,
    service_listing_service,
    task_service,
)
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


# --- Tasker service listings (fixed-price services) ---


@router.get("/me/services", response_model=list[TaskerServiceOut])
def my_services(
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TaskerServiceOut]:
    me = upsert_user_from_principal(db, principal)
    return [
        TaskerServiceOut.model_validate(s)
        for s in service_listing_service.list_for_tasker(db, me.id)
    ]


@router.post(
    "/me/services",
    response_model=TaskerServiceOut,
    status_code=status.HTTP_201_CREATED,
)
def create_my_service(
    payload: TaskerServiceCreate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskerServiceOut:
    me = upsert_user_from_principal(db, principal)
    if not task_service.category_exists(db, payload.category_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown category")
    svc = service_listing_service.create_service(db, me, payload)
    return TaskerServiceOut.model_validate(svc)


def _my_service_or_404(db: Session, service_id: uuid.UUID, user_id: uuid.UUID):
    svc = service_listing_service.get(db, service_id)
    if svc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    if svc.tasker_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your service")
    return svc


@router.patch("/me/services/{service_id}", response_model=TaskerServiceOut)
def update_my_service(
    service_id: uuid.UUID,
    payload: TaskerServiceUpdate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskerServiceOut:
    me = upsert_user_from_principal(db, principal)
    svc = _my_service_or_404(db, service_id, me.id)
    if payload.category_id is not None and not task_service.category_exists(db, payload.category_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown category")
    return TaskerServiceOut.model_validate(
        service_listing_service.update_service(db, svc, payload)
    )


@router.delete("/me/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_service(
    service_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    me = upsert_user_from_principal(db, principal)
    svc = _my_service_or_404(db, service_id, me.id)
    service_listing_service.delete_service(db, svc)
