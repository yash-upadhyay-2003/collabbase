import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)


class ProjectRead(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    created_by: uuid.UUID | None
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectMemberRead(BaseModel):
    user_id: uuid.UUID
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class MemberWithUserRead(BaseModel):
    user_id: uuid.UUID
    role: str
    joined_at: datetime
    full_name: str
    email: str

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    email: EmailStr


class PaginatedProjects(BaseModel):
    items: list[ProjectRead]
    total: int
    limit: int
    offset: int
