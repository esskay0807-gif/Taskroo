import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ReviewRole
from app.schemas.task import PosterSummary


class ReviewCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)
    photo_urls: list[str] = Field(default_factory=list, max_length=10)


class ReviewPhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    sort_order: int


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    reviewer: PosterSummary
    reviewee_id: uuid.UUID
    role: ReviewRole
    rating: int
    comment: str | None
    photos: list[ReviewPhotoOut]
    created_at: datetime
