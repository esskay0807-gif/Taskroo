import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.db import get_db
from app.models.enums import TaskStatus
from app.models.task import Task
from app.schemas.review import ReviewCreate, ReviewOut
from app.services import review_service, task_service
from app.services.user_service import upsert_user_from_principal

router = APIRouter(tags=["reviews"])


def _task_or_404(db: Session, task_id: uuid.UUID) -> Task:
    task = task_service.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.post(
    "/tasks/{task_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    task_id: uuid.UUID,
    payload: ReviewCreate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewOut:
    me = upsert_user_from_principal(db, principal)
    task = _task_or_404(db, task_id)

    if task.status != TaskStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Reviews are only allowed after the task is completed",
        )
    if me.id not in (task.poster_id, task.assigned_tasker_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the task's poster or tasker can review",
        )
    if review_service.has_reviewed(db, task.id, me.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this task",
        )

    review = review_service.create_review(db, task, me, payload)
    return ReviewOut.model_validate(review)


@router.get("/tasks/{task_id}/reviews", response_model=list[ReviewOut])
def list_task_reviews(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> list[ReviewOut]:
    reviews = review_service.list_reviews_for_task(db, task_id)
    return [ReviewOut.model_validate(r) for r in reviews]


@router.get("/users/{user_id}/reviews", response_model=list[ReviewOut])
def list_user_reviews(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> list[ReviewOut]:
    reviews = review_service.list_reviews_for_user(db, user_id)
    return [ReviewOut.model_validate(r) for r in reviews]
