from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.user import User, tasker_categories


def recommend_for_task(db: Session, task: Task, limit: int = 10) -> list[User]:
    """Taskers who can do this task, best matches first.

    Criteria: available taskers whose skills include the task's category, excluding the
    poster. Ranked by same-city-as-task first, then rating, review count, completion rate.
    """
    same_city = case(
        (User.city.isnot(None) & (User.city == task.city), 1),
        else_=0,
    )
    stmt = (
        select(User)
        .join(tasker_categories, tasker_categories.c.user_id == User.id)
        .where(
            tasker_categories.c.category_id == task.category_id,
            User.is_tasker.is_(True),
            User.is_available.is_(True),
            User.id != task.poster_id,
        )
        .order_by(
            same_city.desc(),
            User.rating_avg.desc(),
            User.rating_count.desc(),
            User.completion_rate.desc(),
            User.created_at.desc(),
        )
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().unique().all())
