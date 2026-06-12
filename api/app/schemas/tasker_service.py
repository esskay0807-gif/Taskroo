import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import LocationType
from app.schemas.category import CategoryOut


class TaskerServiceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_id: uuid.UUID
    title: str = Field(min_length=3, max_length=120)
    price: int = Field(gt=0)
    description: str | None = Field(default=None, max_length=2000)


class TaskerServiceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_id: uuid.UUID | None = None
    title: str | None = Field(default=None, min_length=3, max_length=120)
    price: int | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class TaskerServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: CategoryOut
    title: str
    price: int
    description: str | None
    is_active: bool


class TaskerDirectoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str | None
    avatar_url: str | None
    city: str | None
    rating_avg: float
    rating_count: int
    completion_rate: float
    services: list[TaskerServiceOut]


class TaskerDirectoryResponse(BaseModel):
    items: list[TaskerDirectoryItem]
    total: int
    limit: int
    offset: int


class ServiceRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    location_type: LocationType = LocationType.in_person
    city: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=300)
    note: str | None = Field(default=None, max_length=2000)
