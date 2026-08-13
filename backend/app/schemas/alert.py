from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.alert_status import AlertStatus
from app.core.incident_severity import IncidentSeverity


class AlertCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: AlertStatus = AlertStatus.new
    severity: IncidentSeverity
    service_id: int = Field(gt=0)
    incident_id: int | None = Field(default=None, gt=0)


class AlertUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: AlertStatus | None = None
    severity: IncidentSeverity | None = None
    service_id: int | None = Field(default=None, gt=0)
    incident_id: int | None = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    status: str
    severity: str
    service_id: int
    incident_id: int | None
    created_at: datetime
    updated_at: datetime


class AlertListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: str | None = None
    status: AlertStatus | None = None
    severity: IncidentSeverity | None = None
    service_id: int | None = Field(default=None, gt=0)
    incident_id: int | None = Field(default=None, gt=0)


class PaginatedAlertResponse(BaseModel):
    items: list[AlertResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
