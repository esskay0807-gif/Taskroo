import uuid
from dataclasses import dataclass

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.enums import LocationType, TaskStatus
from app.models.task import Task, TaskPhoto
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate


@dataclass
class TaskFilters:
    category: str | None = None  # slug or UUID string
    location_type: LocationType | None = None
    city: str | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    q: str | None = None
    sort: str = "newest"  # newest | budget_asc | budget_desc
    limit: int = 20
    offset: int = 0


def create_task(db: Session, poster: User, payload: TaskCreate) -> Task:
    task = Task(
        poster_id=poster.id,
        category_id=payload.category_id,
        title=payload.title,
        description=payload.description,
        status=TaskStatus.open,
        location_type=payload.location_type,
        city=payload.city,
        address=payload.address,
        lat=payload.lat,
        lng=payload.lng,
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
    )
    for i, url in enumerate(payload.photo_urls):
        task.photos.append(TaskPhoto(url=url, sort_order=i))
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task(db: Session, task_id: uuid.UUID) -> Task | None:
    return db.get(Task, task_id)


def list_tasks_by_poster(db: Session, poster_id: uuid.UUID) -> list[Task]:
    stmt = (
        select(Task)
        .where(Task.poster_id == poster_id)
        .order_by(Task.created_at.desc())
    )
    return list(db.execute(stmt).scalars().unique().all())


def category_exists(db: Session, category_id: uuid.UUID) -> bool:
    return db.get(Category, category_id) is not None


def update_task(db: Session, task: Task, payload: TaskUpdate) -> Task:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


def cancel_task(db: Session, task: Task) -> Task:
    task.status = TaskStatus.cancelled
    db.commit()
    db.refresh(task)
    return task


def _apply_filters(stmt, filters: TaskFilters):
    # Browse only surfaces open, publicly-posted tasks (not direct service requests).
    stmt = stmt.where(
        Task.status == TaskStatus.open,
        Task.is_direct_request.is_(False),
    )

    if filters.category:
        try:
            cat_uuid = uuid.UUID(filters.category)
            stmt = stmt.where(Task.category_id == cat_uuid)
        except ValueError:
            stmt = stmt.join(Category, Task.category_id == Category.id).where(
                Category.slug == filters.category
            )

    if filters.location_type:
        stmt = stmt.where(Task.location_type == filters.location_type)

    if filters.city:
        stmt = stmt.where(Task.city.ilike(f"%{filters.city}%"))

    if filters.q:
        like = f"%{filters.q}%"
        stmt = stmt.where(or_(Task.title.ilike(like), Task.description.ilike(like)))

    # Budget range overlap.
    if filters.budget_min is not None:
        stmt = stmt.where(Task.budget_max >= filters.budget_min)
    if filters.budget_max is not None:
        stmt = stmt.where(Task.budget_min <= filters.budget_max)

    return stmt


def list_tasks(db: Session, filters: TaskFilters) -> tuple[list[Task], int]:
    base = _apply_filters(select(Task), filters)

    total = db.execute(
        _apply_filters(select(func.count(Task.id)), filters)
    ).scalar_one()

    if filters.sort == "budget_asc":
        base = base.order_by(Task.budget_min.asc())
    elif filters.sort == "budget_desc":
        base = base.order_by(Task.budget_max.desc())
    else:  # newest
        base = base.order_by(Task.created_at.desc())

    base = base.limit(filters.limit).offset(filters.offset)
    items = list(db.execute(base).scalars().unique().all())
    return items, total
