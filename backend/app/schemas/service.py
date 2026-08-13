from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ServiceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(max_length=100)
    description: str | None = None
    owner_id: int
    uptime: Decimal = Field(max_digits=5, decimal_places=2)


class ServiceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    owner_id: int | None = None
    uptime: Decimal | None = Field(default=None, max_digits=5, decimal_places=2)


class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    status: str
    owner_id: int
    uptime: Decimal
    created_at: datetime
    updated_at: datetime
