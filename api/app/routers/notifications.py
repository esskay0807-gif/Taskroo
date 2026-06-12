import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.db import get_db
from app.schemas.notification import NotificationListResponse, NotificationOut
from app.services import notification_service
from app.services.user_service import upsert_user_from_principal

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=NotificationListResponse)
def list_notifications(
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationListResponse:
    me = upsert_user_from_principal(db, principal)
    items = notification_service.list_for_user(db, me.id)
    return NotificationListResponse(
        items=[NotificationOut.model_validate(n) for n in items],
        unread_count=notification_service.unread_count(db, me.id),
    )


@router.post("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationOut:
    me = upsert_user_from_principal(db, principal)
    notification = notification_service.get(db, notification_id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if notification.user_id != me.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your notification")
    notification = notification_service.mark_read(db, notification)
    return NotificationOut.model_validate(notification)
