import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.db import get_db
from app.models.enums import NotificationType
from app.schemas.task import TaskOut
from app.schemas.tasker_service import (
    ServiceRequestCreate,
    TaskerDirectoryItem,
    TaskerDirectoryResponse,
    TaskerServiceOut,
)
from app.services import (
    notification_service,
    service_listing_service,
    tasker_service,
)
from app.services.tasker_service import DirectoryFilters
from app.services.user_service import upsert_user_from_principal

router = APIRouter(tags=["taskers"])


@router.get("/taskers", response_model=TaskerDirectoryResponse)
def list_taskers(
    db: Session = Depends(get_db),
    category: str | None = Query(default=None),
    city: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> TaskerDirectoryResponse:
    rows, total = tasker_service.list_directory(
        db, DirectoryFilters(category=category, city=city, q=q, limit=limit, offset=offset)
    )
    items = [
        TaskerDirectoryItem(
            id=user.id,
            name=user.name,
            avatar_url=user.avatar_url,
            city=user.city,
            rating_avg=user.rating_avg,
            rating_count=user.rating_count,
            completion_rate=user.completion_rate,
            services=[TaskerServiceOut.model_validate(s) for s in services],
        )
        for user, services in rows
    ]
    return TaskerDirectoryResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("/tasker-services/{service_id}/request", response_model=TaskOut)
def request_service(
    service_id: uuid.UUID,
    payload: ServiceRequestCreate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TaskOut:
    me = upsert_user_from_principal(db, principal)
    listing = service_listing_service.get(db, service_id)
    if listing is None or not listing.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    if listing.tasker_id == me.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot request your own service",
        )

    task = service_listing_service.request_service(db, me, listing, payload)
    notification_service.notify(
        db,
        settings,
        listing.tasker_id,
        NotificationType.invite_received,
        {"task_id": str(task.id), "task_title": task.title},
    )
    return TaskOut.model_validate(task)
