from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str
    title: str
    message: str
    is_read: bool
    incident_id: int | None
    alert_id: int | None
    created_at: datetime


class NotificationListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    is_read: bool | None = None


class PaginatedNotificationResponse(BaseModel):
    items: list[NotificationResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class MarkAllReadResponse(BaseModel):
    updated_count: int
