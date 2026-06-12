import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import ReviewRole
from app.models.review import Review, ReviewPhoto
from app.models.task import Task
from app.models.user import User
from app.schemas.review import ReviewCreate
from app.services import stats_service


def has_reviewed(db: Session, task_id: uuid.UUID, reviewer_id: uuid.UUID) -> bool:
    stmt = select(Review.id).where(
        Review.task_id == task_id, Review.reviewer_id == reviewer_id
    )
    return db.execute(stmt).first() is not None


def create_review(
    db: Session, task: Task, reviewer: User, payload: ReviewCreate
) -> Review:
    """Create a review. Caller must have verified the task is completed and the
    reviewer is a participant. Reviewee + role are derived from the reviewer's side."""
    if reviewer.id == task.poster_id:
        reviewee_id = task.assigned_tasker_id
        role = ReviewRole.of_tasker
    else:
        reviewee_id = task.poster_id
        role = ReviewRole.of_poster

    review = Review(
        task_id=task.id,
        reviewer_id=reviewer.id,
        reviewee_id=reviewee_id,
        role=role,
        rating=payload.rating,
        comment=payload.comment,
    )
    for i, url in enumerate(payload.photo_urls):
        review.photos.append(ReviewPhoto(url=url, sort_order=i))
    db.add(review)
    db.flush()

    # Recompute the reviewee's trust signals.
    reviewee = db.get(User, reviewee_id)
    if reviewee is not None:
        stats_service.recompute_user(db, reviewee)

    db.commit()
    db.refresh(review)
    return review


def list_reviews_for_user(db: Session, user_id: uuid.UUID) -> list[Review]:
    stmt = (
        select(Review)
        .where(Review.reviewee_id == user_id)
        .order_by(Review.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def list_reviews_for_task(db: Session, task_id: uuid.UUID) -> list[Review]:
    stmt = (
        select(Review)
        .where(Review.task_id == task_id)
        .order_by(Review.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())
