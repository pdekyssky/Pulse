from pydantic import BaseModel, Field

from app.schemas.incident import IncidentResponse


class IncidentTotals(BaseModel):
    total: int
    active: int
    resolved: int


class ServiceTotals(BaseModel):
    total: int


class AlertTotals(BaseModel):
    total: int
    active: int
    resolved: int


class DashboardOverviewResponse(BaseModel):
    incidents: IncidentTotals
    incidents_by_severity: dict[str, int]
    incidents_by_status: dict[str, int]
    services: ServiceTotals
    services_by_status: dict[str, int]
    alerts: AlertTotals
    alerts_by_status: dict[str, int]
    recent_incidents: list[IncidentResponse] = Field(default_factory=list)
