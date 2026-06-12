"""Recompute a user's trust signals: rating_avg, rating_count, completion_rate."""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import TaskStatus
from app.models.review import Review
from app.models.task import Task
from app.models.user import User

# completion_rate looks at this many of a user's most recent relevant tasks.
COMPLETION_WINDOW = 20


def recompute_rating(db: Session, user: User) -> None:
    row = db.execute(
        select(func.count(Review.id), func.avg(Review.rating)).where(
            Review.reviewee_id == user.id
        )
    ).one()
    count, avg = row[0], row[1]
    user.rating_count = int(count or 0)
    user.rating_avg = float(avg) if avg is not None else 0.0


def recompute_completion_rate(db: Session, user: User) -> None:
    """completion_rate = completed / last 20 non-cancelled tasks where the user is the
    poster or the assigned tasker (both roles combined). Cancellations are poster-caused
    in our model, so excluding cancelled tasks satisfies "excluding poster-caused cancellations".
    """
    stmt = (
        select(Task.status)
        .where(
            or_(Task.poster_id == user.id, Task.assigned_tasker_id == user.id),
            Task.status != TaskStatus.cancelled,
        )
        .order_by(Task.created_at.desc())
        .limit(COMPLETION_WINDOW)
    )
    statuses = list(db.execute(stmt).scalars().all())
    if not statuses:
        user.completion_rate = 0.0
        return
    completed = sum(1 for s in statuses if s == TaskStatus.completed)
    user.completion_rate = completed / len(statuses)


def recompute_user(db: Session, user: User) -> None:
    recompute_rating(db, user)
    recompute_completion_rate(db, user)


def recompute_user_id(db: Session, user_id: uuid.UUID | None) -> None:
    if user_id is None:
        return
    user = db.get(User, user_id)
    if user is not None:
        recompute_completion_rate(db, user)
