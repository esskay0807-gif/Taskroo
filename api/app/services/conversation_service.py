import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation, Message
from app.models.task import Task
from app.models.user import User


@dataclass
class ConversationView:
    """A conversation plus the per-viewer derived fields for ConversationOut."""

    conversation: Conversation
    task: Task
    other_user: User
    last_message: Message | None
    unread_count: int


def get_or_create_conversation(db: Session, task: Task, tasker: User) -> Conversation:
    """Return the (task, tasker) conversation, creating it if needed."""
    conv = db.execute(
        select(Conversation).where(
            Conversation.task_id == task.id, Conversation.tasker_id == tasker.id
        )
    ).scalar_one_or_none()
    if conv is None:
        conv = Conversation(
            task_id=task.id, poster_id=task.poster_id, tasker_id=tasker.id
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv


def get_conversation(db: Session, conversation_id: uuid.UUID) -> Conversation | None:
    return db.get(Conversation, conversation_id)


def is_participant(conv: Conversation, user_id: uuid.UUID) -> bool:
    return user_id in (conv.poster_id, conv.tasker_id)


def list_conversations_for_user(db: Session, user_id: uuid.UUID) -> list[ConversationView]:
    convs = list(
        db.execute(
            select(Conversation).where(
                or_(
                    Conversation.poster_id == user_id,
                    Conversation.tasker_id == user_id,
                )
            )
        )
        .scalars()
        .all()
    )

    views: list[ConversationView] = []
    for conv in convs:
        messages = conv.messages  # already ordered by created_at (selectin relationship)
        last_message = messages[-1] if messages else None
        unread = sum(
            1 for m in messages if m.sender_id != user_id and m.read_at is None
        )
        other_user = conv.tasker if conv.poster_id == user_id else conv.poster
        views.append(
            ConversationView(
                conversation=conv,
                task=conv.task,
                other_user=other_user,
                last_message=last_message,
                unread_count=unread,
            )
        )

    # Newest activity first: last message time, else conversation creation time.
    def activity(v: ConversationView) -> datetime:
        return v.last_message.created_at if v.last_message else v.conversation.created_at

    views.sort(key=activity, reverse=True)
    return views


def list_messages(db: Session, conv: Conversation) -> list[Message]:
    return list(
        db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at)
        )
        .scalars()
        .all()
    )


def mark_read(db: Session, conv: Conversation, reader_id: uuid.UUID) -> None:
    """Mark messages from the other party as read."""
    db.execute(
        Message.__table__.update()
        .where(
            Message.conversation_id == conv.id,
            Message.sender_id != reader_id,
            Message.read_at.is_(None),
        )
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()


def create_message(
    db: Session, conv: Conversation, sender_id: uuid.UUID, body: str
) -> Message:
    message = Message(conversation_id=conv.id, sender_id=sender_id, body=body)
    db.add(message)
    # Touch the conversation so it sorts to the top of the list.
    conv.updated_at = func.now()
    db.commit()
    db.refresh(message)
    return message
