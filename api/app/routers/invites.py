import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.db import get_db
from app.models.enums import InviteStatus, NotificationType, TaskStatus
from app.models.invite import TaskInvite
from app.models.task import Task
from app.schemas.invite import (
    InviteCreate,
    InviteOut,
    RecommendedTasker,
)
from app.services import invite_service, notification_service, task_service, tasker_service
from app.services.user_service import upsert_user_from_principal

router = APIRouter(tags=["invites"])


def _task_or_404(db: Session, task_id: uuid.UUID) -> Task:
    task = task_service.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def _require_poster(task: Task, user_id: uuid.UUID) -> None:
    if task.poster_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your task")


@router.get(
    "/tasks/{task_id}/recommended-taskers",
    response_model=list[RecommendedTasker],
)
def recommended_taskers(
    task_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RecommendedTasker]:
    me = upsert_user_from_principal(db, principal)
    task = _task_or_404(db, task_id)
    _require_poster(task, me.id)
    taskers = tasker_service.recommend_for_task(db, task)
    return [RecommendedTasker.model_validate(t) for t in taskers]


@router.post(
    "/tasks/{task_id}/invites",
    response_model=list[InviteOut],
    status_code=status.HTTP_201_CREATED,
)
def create_invites(
    task_id: uuid.UUID,
    payload: InviteCreate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> list[InviteOut]:
    me = upsert_user_from_principal(db, principal)
    task = _task_or_404(db, task_id)
    _require_poster(task, me.id)
    if task.status != TaskStatus.open:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task is not open for invites",
        )

    invites = invite_service.create_invites(db, task, payload.tasker_ids)
    for inv in invites:
        notification_service.notify(
            db,
            settings,
            inv.tasker_id,
            NotificationType.invite_received,
            {"task_id": str(task.id), "task_title": task.title},
        )
    return [InviteOut.model_validate(i) for i in invites]


@router.get("/tasks/{task_id}/invites", response_model=list[InviteOut])
def list_task_invites(
    task_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[InviteOut]:
    me = upsert_user_from_principal(db, principal)
    task = _task_or_404(db, task_id)
    _require_poster(task, me.id)
    return [InviteOut.model_validate(i) for i in invite_service.list_for_task(db, task.id)]


def _invite_or_404(db: Session, invite_id: uuid.UUID) -> TaskInvite:
    invite = invite_service.get(db, invite_id)
    if invite is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    return invite


@router.post("/invites/{invite_id}/accept", response_model=InviteOut)
def accept_invite(
    invite_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> InviteOut:
    me = upsert_user_from_principal(db, principal)
    invite = _invite_or_404(db, invite_id)
    if invite.tasker_id != me.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your invite")
    if invite.status != InviteStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Invite is no longer pending"
        )
    task = _task_or_404(db, invite.task_id)
    if task.status != TaskStatus.open:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task is no longer open",
        )

    invite = invite_service.accept_invite(db, invite, task)
    notification_service.notify(
        db,
        settings,
        task.poster_id,
        NotificationType.invite_accepted,
        {"task_id": str(task.id), "task_title": task.title},
    )
    return InviteOut.model_validate(invite)


@router.post("/invites/{invite_id}/decline", response_model=InviteOut)
def decline_invite(
    invite_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InviteOut:
    me = upsert_user_from_principal(db, principal)
    invite = _invite_or_404(db, invite_id)
    if invite.tasker_id != me.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your invite")
    if invite.status != InviteStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Invite is no longer pending"
        )
    return InviteOut.model_validate(invite_service.decline_invite(db, invite))
