import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.db import get_db
from app.models.conversation import Conversation
from app.models.enums import NotificationType
from app.schemas.conversation import (
    ConversationOut,
    ConversationTaskSummary,
    MessageCreate,
    MessageOut,
)
from app.schemas.task import PosterSummary
from app.services import conversation_service, notification_service
from app.services.user_service import upsert_user_from_principal

router = APIRouter(tags=["conversations"])


def _conversation_or_404(db: Session, conversation_id: uuid.UUID) -> Conversation:
    conv = conversation_service.get_conversation(db, conversation_id)
    if conv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conv


def _require_participant(conv: Conversation, user_id: uuid.UUID) -> None:
    if not conversation_service.is_participant(conv, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this conversation",
        )


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ConversationOut]:
    me = upsert_user_from_principal(db, principal)
    views = conversation_service.list_conversations_for_user(db, me.id)
    return [
        ConversationOut(
            id=v.conversation.id,
            task=ConversationTaskSummary.model_validate(v.task),
            other_user=PosterSummary.model_validate(v.other_user),
            last_message=MessageOut.model_validate(v.last_message) if v.last_message else None,
            unread_count=v.unread_count,
        )
        for v in views
    ]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(
    conversation_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MessageOut]:
    me = upsert_user_from_principal(db, principal)
    conv = _conversation_or_404(db, conversation_id)
    _require_participant(conv, me.id)
    conversation_service.mark_read(db, conv, me.id)
    messages = conversation_service.list_messages(db, conv)
    return [MessageOut.model_validate(m) for m in messages]


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
def post_message(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MessageOut:
    me = upsert_user_from_principal(db, principal)
    conv = _conversation_or_404(db, conversation_id)
    _require_participant(conv, me.id)
    message = conversation_service.create_message(db, conv, me.id, payload.body)

    recipient_id = conv.tasker_id if me.id == conv.poster_id else conv.poster_id
    preview = payload.body[:120]
    notification_service.notify(
        db,
        settings,
        recipient_id,
        NotificationType.new_message,
        {
            "conversation_id": str(conv.id),
            "task_id": str(conv.task_id),
            "task_title": conv.task.title,
            "preview": preview,
        },
    )
    return MessageOut.model_validate(message)
