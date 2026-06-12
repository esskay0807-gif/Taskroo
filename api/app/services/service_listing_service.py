import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import TaskStatus
from app.models.task import Task
from app.models.tasker_service import TaskerService
from app.models.user import User
from app.schemas.tasker_service import (
    ServiceRequestCreate,
    TaskerServiceCreate,
    TaskerServiceUpdate,
)
from app.services import invite_service


def create_service(
    db: Session, tasker: User, payload: TaskerServiceCreate
) -> TaskerService:
    svc = TaskerService(
        tasker_id=tasker.id,
        category_id=payload.category_id,
        title=payload.title,
        price=payload.price,
        description=payload.description,
    )
    tasker.is_tasker = True
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc


def list_for_tasker(
    db: Session, tasker_id: uuid.UUID, active_only: bool = False
) -> list[TaskerService]:
    stmt = select(TaskerService).where(TaskerService.tasker_id == tasker_id)
    if active_only:
        stmt = stmt.where(TaskerService.is_active.is_(True))
    stmt = stmt.order_by(TaskerService.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def get(db: Session, service_id: uuid.UUID) -> TaskerService | None:
    return db.get(TaskerService, service_id)


def update_service(
    db: Session, svc: TaskerService, payload: TaskerServiceUpdate
) -> TaskerService:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(svc, field, value)
    db.commit()
    db.refresh(svc)
    return svc


def delete_service(db: Session, svc: TaskerService) -> None:
    db.delete(svc)
    db.commit()


def request_service(
    db: Session,
    requester: User,
    listing: TaskerService,
    payload: ServiceRequestCreate,
) -> Task:
    """Create a fixed-price task from a service listing and invite its tasker."""
    task = Task(
        poster_id=requester.id,
        category_id=listing.category_id,
        title=listing.title,
        description=(payload.note or listing.description or listing.title),
        status=TaskStatus.open,
        location_type=payload.location_type,
        city=payload.city,
        address=payload.address,
        budget_min=listing.price,
        budget_max=listing.price,
        is_direct_request=True,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    invite_service.create_invites(db, task, [listing.tasker_id])
    return task
