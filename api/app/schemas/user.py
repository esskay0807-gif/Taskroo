import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UserOut(BaseModel):
    """Private representation of the authenticated user (GET/PATCH /v1/me)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clerk_id: str
    email: str | None

    name: str | None
    avatar_url: str | None
    bio: str | None
    city: str | None
    lat: float | None
    lng: float | None

    is_poster: bool
    is_tasker: bool
    phone_verified: bool
    id_verified: bool

    rating_avg: float
    rating_count: int
    completion_rate: float

    created_at: datetime
    updated_at: datetime


class PublicUserOut(BaseModel):
    """Public profile (GET /v1/users/{id}). Omits email and precise coordinates."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str | None
    avatar_url: str | None
    bio: str | None
    city: str | None

    is_poster: bool
    is_tasker: bool
    phone_verified: bool
    id_verified: bool

    rating_avg: float
    rating_count: int
    completion_rate: float

    created_at: datetime


class UserUpdate(BaseModel):
    """Editable profile fields (PATCH /v1/me).

    Only these fields are client-editable — verification and rating fields are
    server-managed and intentionally excluded.
    """

    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=1000)
    city: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = Field(default=None, max_length=2000)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    is_poster: bool | None = None
    is_tasker: bool | None = None


class PresignRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=128)
    kind: Literal["avatar", "task", "review"] = "avatar"


class PresignResponse(BaseModel):
    upload_url: str
    public_url: str
    key: str
    method: str = "PUT"
    headers: dict[str, str] = Field(default_factory=dict)
