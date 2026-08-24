from enum import StrEnum


class ReportType(StrEnum):
    incident_summary = "incident_summary"
    service_availability = "service_availability"
    performance = "performance"
    alert_summary = "alert_summary"
    monthly_operations = "monthly_operations"


class ReportStatus(StrEnum):
    completed = "completed"
    generating = "generating"
    scheduled = "scheduled"
    failed = "failed"


class ReportPeriodFilter(StrEnum):
    all = "all"
    last_7_days = "last_7_days"
    last_30_days = "last_30_days"
    last_90_days = "last_90_days"


REPORT_PERIOD_DAYS: dict[ReportPeriodFilter, int] = {
    ReportPeriodFilter.last_7_days: 7,
    ReportPeriodFilter.last_30_days: 30,
    ReportPeriodFilter.last_90_days: 90,
}

REPORT_TYPE_LABELS: dict[ReportType, str] = {
    ReportType.incident_summary: "Incident Summary",
    ReportType.service_availability: "Service Availability",
    ReportType.performance: "Performance Report",
    ReportType.alert_summary: "Alert Summary",
    ReportType.monthly_operations: "Monthly Operations Report",
}
