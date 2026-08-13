from enum import StrEnum

from sqlalchemy.orm import InstrumentedAttribute

from app.models.incident import Incident


class IncidentSortField(StrEnum):
    started_at = "started_at"
    created_at = "created_at"
    updated_at = "updated_at"
    severity = "severity"
    status = "status"


class SortOrder(StrEnum):
    asc = "asc"
    desc = "desc"


DEFAULT_SORT_FIELD = IncidentSortField.started_at
DEFAULT_SORT_ORDER = SortOrder.desc

INCIDENT_SORT_COLUMNS: dict[IncidentSortField, InstrumentedAttribute] = {
    IncidentSortField.started_at: Incident.started_at,
    IncidentSortField.created_at: Incident.created_at,
    IncidentSortField.updated_at: Incident.updated_at,
    IncidentSortField.severity: Incident.severity,
    IncidentSortField.status: Incident.status,
}
