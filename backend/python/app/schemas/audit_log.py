from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    action: str
    resource_type: str
    resource_id: int | None
    description: str
    created_at: datetime


class AuditLogListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    user_id: int | None = Field(default=None, gt=0)
    action: str | None = None
    resource_type: str | None = None
    resource_id: int | None = Field(default=None, gt=0)
    created_from: datetime | None = None
    created_to: datetime | None = None


class PaginatedAuditLogResponse(BaseModel):
    items: list[AuditLogResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
