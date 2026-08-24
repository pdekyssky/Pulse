from pydantic import BaseModel, Field

from app.core.analytics_range import AnalyticsDateRange


class AnalyticsOverviewQuery(BaseModel):
    date_range: AnalyticsDateRange = AnalyticsDateRange.seven_days
    service_id: int | None = Field(default=None, gt=0)


class UptimeDataPoint(BaseModel):
    date: str
    label: str
    uptime: float


class IncidentTrendDataPoint(BaseModel):
    date: str
    label: str
    total: int
    critical: int
    resolved: int


class ResponseTimeDataPoint(BaseModel):
    date: str
    label: str
    response_time: float


class ServicePerformanceRow(BaseModel):
    service_id: int
    service_name: str
    uptime: float
    response_time: float
    incident_count: int


class AnalyticsKpis(BaseModel):
    overall_uptime: str
    average_response_time: str
    total_incidents: int
    mttr: str
    alert_volume: int


class AnalyticsOverviewResponse(BaseModel):
    date_range: AnalyticsDateRange
    service_id: int | None
    kpis: AnalyticsKpis
    uptime_series: list[UptimeDataPoint]
    incident_trend: list[IncidentTrendDataPoint]
    response_time_series: list[ResponseTimeDataPoint]
    service_performance: list[ServicePerformanceRow]
