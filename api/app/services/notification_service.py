import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.services import email_client


def _email_content(ntype: NotificationType, payload: dict) -> tuple[str, str]:
    title = payload.get("task_title", "your task")
    if ntype == NotificationType.offer_received:
        subject = f"New offer on “{title}”"
        body = f"You received an offer of ₹{payload.get('amount')} on “{title}”."
    elif ntype == NotificationType.offer_accepted:
        subject = f"Your offer was accepted — “{title}”"
        body = f"Your offer of ₹{payload.get('amount')} on “{title}” was accepted."
    elif ntype == NotificationType.new_message:
        subject = f"New message about “{title}”"
        body = payload.get("preview") or f"You have a new message about “{title}”."
    elif ntype == NotificationType.task_completed:
        subject = f"Task completed — “{title}”"
        body = f"“{title}” was marked complete. ₹{payload.get('net_amount')} was released to you."
    else:
        subject = "TaskMarket notification"
        body = "You have a new notification."
    return subject, f"<p>{body}</p>"


def notify(
    db: Session,
    settings: Settings,
    user_id: uuid.UUID | None,
    ntype: NotificationType,
    payload: dict,
) -> Notification | None:
    """Create an in-app notification and best-effort email the recipient."""
    if user_id is None:
        return None
    notification = Notification(user_id=user_id, type=ntype.value, payload=payload)
    db.add(notification)
    db.commit()
    db.refresh(notification)

    recipient = db.get(User, user_id)
    subject, html = _email_content(ntype, payload)
    email_client.send_email(settings, recipient.email if recipient else None, subject, html)
    return notification


def list_for_user(db: Session, user_id: uuid.UUID, limit: int = 50) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def unread_count(db: Session, user_id: uuid.UUID) -> int:
    stmt = select(func.count(Notification.id)).where(
        Notification.user_id == user_id, Notification.read_at.is_(None)
    )
    return int(db.execute(stmt).scalar_one())


def get(db: Session, notification_id: uuid.UUID) -> Notification | None:
    return db.get(Notification, notification_id)


def mark_read(db: Session, notification: Notification) -> Notification:
    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return notification
