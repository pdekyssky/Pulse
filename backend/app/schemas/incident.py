from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.incident_sort import IncidentSortField, SortOrder
from app.core.incident_status import IncidentStatus
from app.core.incident_severity import IncidentSeverity


class IncidentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: IncidentStatus
    severity: IncidentSeverity
    service_id: int = Field(gt=0)
    started_at: datetime
    resolved_at: datetime | None = None


class IncidentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: IncidentStatus | None = None
    severity: IncidentSeverity | None = None
    service_id: int | None = Field(default=None, gt=0)
    assigned_to_id: int | None = None
    started_at: datetime | None = None
    resolved_at: datetime | None = None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: str
    severity: str
    service_id: int
    created_by_id: int
    assigned_to_id: int | None
    started_at: datetime
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class IncidentListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: str | None = None
    status: IncidentStatus | None = None
    severity: IncidentSeverity | None = None
    assigned_to_id: int | None = None
    service_id: int | None = None
    sort_by: IncidentSortField | None = None
    sort_order: SortOrder | None = None


class PaginatedIncidentResponse(BaseModel):
    items: list[IncidentResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
