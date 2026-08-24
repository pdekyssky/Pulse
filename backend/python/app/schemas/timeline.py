from datetime import datetime

from pydantic import BaseModel, Field

from app.core.timeline_event_type import TimelineEventSeverity, TimelineEventType, TimelinePeriod


class TimelineListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    search: str | None = None
    type: TimelineEventType | None = None
    service_id: int | None = Field(default=None, gt=0)
    incident_id: int | None = Field(default=None, gt=0)
    alert_id: int | None = Field(default=None, gt=0)
    period: TimelinePeriod = TimelinePeriod.all


class TimelineEventResponse(BaseModel):
    id: str
    timestamp: datetime
    type: TimelineEventType
    title: str
    description: str
    service_id: int | None = None
    incident_id: int | None = None
    alert_id: int | None = None
    severity: TimelineEventSeverity | None = None


class TimelineStatsResponse(BaseModel):
    events_today: int
    incidents: int
    alerts: int
    service_events: int


class PaginatedTimelineResponse(BaseModel):
    items: list[TimelineEventResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
    stats: TimelineStatsResponse
