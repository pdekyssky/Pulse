from datetime import datetime

from pydantic import BaseModel, Field

from app.core.report_type import ReportPeriodFilter, ReportStatus, ReportType


class ReportMetricResponse(BaseModel):
    label: str
    value: str


class ReportResponse(BaseModel):
    id: str
    name: str
    type: ReportType
    period_start: datetime
    period_end: datetime
    created_at: datetime
    status: ReportStatus
    generated_by_id: int
    description: str | None = None
    summary: str
    scope: str
    service_ids: list[int] | None = None
    metrics: list[ReportMetricResponse]
    scheduled_for: datetime | None = None


class ReportStatsResponse(BaseModel):
    total: int
    incident_reports: int
    service_reports: int
    scheduled: int


class ReportListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    search: str | None = None
    type: ReportType | None = None
    status: ReportStatus | None = None
    period: ReportPeriodFilter = ReportPeriodFilter.all


class PaginatedReportResponse(BaseModel):
    items: list[ReportResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
    stats: ReportStatsResponse
