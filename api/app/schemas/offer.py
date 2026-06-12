import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OfferStatus
from app.schemas.task import PosterSummary, TaskOut


class OfferCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    amount: int = Field(gt=0)
    message: str | None = Field(default=None, max_length=1000)


class OfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    amount: int
    message: str | None
    status: OfferStatus
    tasker: PosterSummary
    created_at: datetime


class MyOfferOut(OfferOut):
    """An offer I made, with the task it's on (tasker dashboard)."""

    task: TaskOut
