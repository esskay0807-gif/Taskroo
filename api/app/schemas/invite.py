import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import InviteStatus
from app.schemas.category import CategoryOut
from app.schemas.task import PosterSummary, TaskOut


class RecommendedTasker(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str | None
    avatar_url: str | None
    city: str | None
    rating_avg: float
    rating_count: int
    completion_rate: float
    categories: list[CategoryOut]


class InviteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tasker_ids: list[uuid.UUID] = Field(min_length=1, max_length=20)


class InviteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    tasker: PosterSummary
    status: InviteStatus
    created_at: datetime


class MyInviteOut(InviteOut):
    """An invite I received, with the task it's for."""

    task: TaskOut
