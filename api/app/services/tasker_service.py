from dataclasses import dataclass

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.tasker_service import TaskerService
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


@dataclass
class DirectoryFilters:
    category: str | None = None  # slug or UUID string
    city: str | None = None
    q: str | None = None
    limit: int = 20
    offset: int = 0


def list_directory(
    db: Session, filters: DirectoryFilters
) -> tuple[list[tuple[User, list[TaskerService]]], int]:
    """Local taskers who have at least one active service. Returns (user, active
    services) pairs and a total count."""
    import uuid as _uuid

    from app.models.category import Category

    # Sub-filter: active services, optionally in a category.
    svc = select(TaskerService.tasker_id).where(TaskerService.is_active.is_(True))
    if filters.category:
        try:
            cat_uuid = _uuid.UUID(filters.category)
            svc = svc.where(TaskerService.category_id == cat_uuid)
        except ValueError:
            svc = svc.join(Category, TaskerService.category_id == Category.id).where(
                Category.slug == filters.category
            )
    tasker_ids_with_service = svc.scalar_subquery()

    base = select(User).where(
        User.is_tasker.is_(True),
        User.is_available.is_(True),
        User.id.in_(tasker_ids_with_service),
    )
    if filters.city:
        base = base.where(User.city.ilike(f"%{filters.city}%"))
    if filters.q:
        base = base.where(User.name.ilike(f"%{filters.q}%"))

    total = db.execute(
        select(func.count()).select_from(base.subquery())
    ).scalar_one()

    rows = list(
        db.execute(
            base.order_by(
                User.rating_avg.desc(),
                User.rating_count.desc(),
                User.completion_rate.desc(),
                User.created_at.desc(),
            )
            .limit(filters.limit)
            .offset(filters.offset)
        )
        .scalars()
        .unique()
        .all()
    )

    result: list[tuple[User, list[TaskerService]]] = []
    for user in rows:
        services = list(
            db.execute(
                select(TaskerService)
                .where(
                    TaskerService.tasker_id == user.id,
                    TaskerService.is_active.is_(True),
                )
                .order_by(TaskerService.price)
            )
            .scalars()
            .all()
        )
        result.append((user, services))
    return result, total
