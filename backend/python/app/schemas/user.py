from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.user_role import UserRole


class UserRegister(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserCreate(BaseModel):
    name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    is_active: bool = True


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=255)
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
