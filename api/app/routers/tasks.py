import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.db import get_db
from app.models.enums import LocationType, PaymentStatus, TaskStatus
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskListResponse, TaskOut, TaskUpdate
from app.services import payment_service, stats_service, task_service
from app.services.task_service import TaskFilters
from app.services.user_service import upsert_user_from_principal

router = APIRouter(tags=["tasks"])


def _get_task_or_404(db: Session, task_id: uuid.UUID) -> Task:
    task = task_service.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.post("/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    poster = upsert_user_from_principal(db, principal)
    if not task_service.category_exists(db, payload.category_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown category")
    task = task_service.create_task(db, poster, payload)
    return TaskOut.model_validate(task)


@router.get("/tasks", response_model=TaskListResponse)
def browse_tasks(
    db: Session = Depends(get_db),
    category: str | None = Query(default=None, description="Category slug or id"),
    location_type: LocationType | None = Query(default=None),
    city: str | None = Query(default=None),
    budget_min: int | None = Query(default=None, ge=0),
    budget_max: int | None = Query(default=None, ge=0),
    q: str | None = Query(default=None),
    sort: str = Query(default="newest", pattern="^(newest|budget_asc|budget_desc)$"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> TaskListResponse:
    filters = TaskFilters(
        category=category,
        location_type=location_type,
        city=city,
        budget_min=budget_min,
        budget_max=budget_max,
        q=q,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    items, total = task_service.list_tasks(db, filters)
    return TaskListResponse(
        items=[TaskOut.model_validate(t) for t in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/tasks/{task_id}", response_model=TaskOut)
def get_task(task_id: uuid.UUID, db: Session = Depends(get_db)) -> TaskOut:
    return TaskOut.model_validate(_get_task_or_404(db, task_id))


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    me = upsert_user_from_principal(db, principal)
    task = _get_task_or_404(db, task_id)
    if task.poster_id != me.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your task")
    if task.status != TaskStatus.open:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task can only be edited while open",
        )
    if payload.category_id is not None and not task_service.category_exists(db, payload.category_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown category")
    task = task_service.update_task(db, task, payload)
    return TaskOut.model_validate(task)


@router.post("/tasks/{task_id}/cancel", response_model=TaskOut)
def cancel_task(
    task_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    me = upsert_user_from_principal(db, principal)
    task = _get_task_or_404(db, task_id)
    if task.poster_id != me.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your task")
    if task.status in (TaskStatus.completed, TaskStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task is already finished",
        )
    assigned_tasker_id = task.assigned_tasker_id
    task = task_service.cancel_task(db, task)
    # Cancelling changes the relevant-task set for completion_rate.
    stats_service.recompute_user_id(db, task.poster_id)
    stats_service.recompute_user_id(db, assigned_tasker_id)
    db.commit()
    return TaskOut.model_validate(task)


@router.post("/tasks/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TaskOut:
    """Poster confirms completion → capture the held payment, deduct the service fee,
    release to the tasker, and mark the task completed."""
    me = upsert_user_from_principal(db, principal)
    task = _get_task_or_404(db, task_id)
    if task.poster_id != me.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your task")
    if task.status != TaskStatus.assigned:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only an assigned task can be completed",
        )

    payment = payment_service.get_payment_by_task(db, task.id)
    if payment is None or payment.status != PaymentStatus.held:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment must be authorized (held) before completing",
        )

    payment_service.capture_and_release(db, task, payment, settings)
    # Completing changes the relevant-task set for completion_rate.
    stats_service.recompute_user_id(db, task.poster_id)
    stats_service.recompute_user_id(db, task.assigned_tasker_id)
    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)
