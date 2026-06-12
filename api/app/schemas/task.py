import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import LocationType, TaskStatus
from app.schemas.category import CategoryOut


class TaskPhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    sort_order: int


class PosterSummary(BaseModel):
    """Lightweight poster info embedded in task responses."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str | None
    avatar_url: str | None
    rating_avg: float
    rating_count: int


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    category_id: uuid.UUID
    location_type: LocationType

    city: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=300)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)

    budget_min: int = Field(gt=0)
    budget_max: int = Field(gt=0)
    photo_urls: list[str] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def _check(self) -> "TaskCreate":
        if self.budget_min > self.budget_max:
            raise ValueError("budget_min must be <= budget_max")
        if self.location_type == LocationType.in_person and not self.city:
            raise ValueError("city is required for in_person tasks")
        return self


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    category_id: uuid.UUID | None = None
    location_type: LocationType | None = None
    city: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=300)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    budget_min: int | None = Field(default=None, gt=0)
    budget_max: int | None = Field(default=None, gt=0)


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    status: TaskStatus
    location_type: LocationType
    city: str | None
    address: str | None
    lat: float | None
    lng: float | None
    budget_min: int
    budget_max: int
    currency: str
    category: CategoryOut
    poster: PosterSummary
    photos: list[TaskPhotoOut]
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    items: list[TaskOut]
    total: int
    limit: int
    offset: int
