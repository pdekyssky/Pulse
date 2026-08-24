from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.analytics_range import DATE_RANGE_DAYS, AnalyticsDateRange
from app.core.incident_severity import IncidentSeverity
from app.core.incident_status import IncidentStatus
from app.core.service_status import ServiceStatus
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.service import Service
from app.schemas.analytics import (
    AnalyticsKpis,
    AnalyticsOverviewQuery,
    AnalyticsOverviewResponse,
    IncidentTrendDataPoint,
    ResponseTimeDataPoint,
    ServicePerformanceRow,
    UptimeDataPoint,
)

STATUS_RESPONSE_TIME_MS: dict[str, float] = {
    ServiceStatus.operational.value: 45.0,
    ServiceStatus.degraded.value: 80.0,
    ServiceStatus.partial_outage.value: 150.0,
    ServiceStatus.major_outage.value: 250.0,
}

SEVERITY_UPTIME_PENALTY: dict[str, float] = {
    IncidentSeverity.critical.value: 1.5,
    IncidentSeverity.high.value: 1.0,
    IncidentSeverity.medium.value: 0.5,
    IncidentSeverity.low.value: 0.2,
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _date_bounds(date_range: AnalyticsDateRange) -> tuple[date, date]:
    days = DATE_RANGE_DAYS[date_range]
    end = _utc_now().date()
    start = end - timedelta(days=days - 1)
    return start, end


def _iter_dates(start: date, end: date) -> list[date]:
    days: list[date] = []
    current = start
    while current <= end:
        days.append(current)
        current += timedelta(days=1)
    return days


def _day_window(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    return start, end


def _format_date_label(day: date) -> str:
    return day.strftime("%b %d")


def _format_uptime(value: float) -> str:
    return f"{value:.2f}%"


def _format_response_time(value: float) -> str:
    return f"{round(value)} ms"


def _format_mttr(total_seconds: float) -> str:
    if total_seconds <= 0:
        return "0m"

    total_minutes = int(total_seconds // 60)
    hours, minutes = divmod(total_minutes, 60)
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def _decimal_to_float(value: Decimal) -> float:
    return float(value)


def _incident_filters(
    query: AnalyticsOverviewQuery,
    range_start: datetime,
    range_end: datetime,
) -> list:
    conditions = [
        Incident.created_at >= range_start,
        Incident.created_at < range_end,
    ]
    if query.service_id is not None:
        conditions.append(Incident.service_id == query.service_id)
    return conditions


def _alert_filters(
    query: AnalyticsOverviewQuery,
    range_start: datetime,
    range_end: datetime,
) -> list:
    conditions = [
        Alert.created_at >= range_start,
        Alert.created_at < range_end,
    ]
    if query.service_id is not None:
        conditions.append(Alert.service_id == query.service_id)
    return conditions


def _load_services(db: Session, query: AnalyticsOverviewQuery) -> list[Service]:
    stmt = select(Service).order_by(Service.name)
    if query.service_id is not None:
        stmt = stmt.where(Service.id == query.service_id)
    return list(db.scalars(stmt).all())


def _load_incidents_in_range(
    db: Session,
    query: AnalyticsOverviewQuery,
    range_start: datetime,
    range_end: datetime,
) -> list[Incident]:
    stmt = select(Incident).where(*_incident_filters(query, range_start, range_end))
    return list(db.scalars(stmt).all())


def _estimate_daily_uptime(
    base_uptime: float,
    incidents: list[Incident],
    day: date,
) -> float:
    day_start, day_end = _day_window(day)
    penalty = 0.0

    for incident in incidents:
        if not (day_start <= incident.created_at < day_end):
            continue
        penalty += SEVERITY_UPTIME_PENALTY.get(incident.severity, 0.3)

    return max(90.0, min(100.0, base_uptime - penalty))


def _estimate_daily_response_time(incidents: list[Incident], day: date) -> float:
    day_start, day_end = _day_window(day)
    baseline = 45.0
    spike = 0.0

    for incident in incidents:
        if not (day_start <= incident.created_at < day_end):
            continue
        if incident.severity == IncidentSeverity.critical.value:
            spike += 50.0
        elif incident.severity == IncidentSeverity.high.value:
            spike += 30.0
        else:
            spike += 10.0

    return baseline + spike


def _build_uptime_series(
    services: list[Service],
    incidents: list[Incident],
    dates: list[date],
) -> list[UptimeDataPoint]:
    if not services:
        return [
            UptimeDataPoint(
                date=day.isoformat(),
                label=_format_date_label(day),
                uptime=100.0,
            )
            for day in dates
        ]

    base_uptime = sum(_decimal_to_float(service.uptime) for service in services) / len(
        services
    )

    return [
        UptimeDataPoint(
            date=day.isoformat(),
            label=_format_date_label(day),
            uptime=round(_estimate_daily_uptime(base_uptime, incidents, day), 2),
        )
        for day in dates
    ]


def _build_incident_trend(
    db: Session,
    query: AnalyticsOverviewQuery,
    dates: list[date],
) -> list[IncidentTrendDataPoint]:
    trend: list[IncidentTrendDataPoint] = []

    for day in dates:
        day_start, day_end = _day_window(day)

        created_conditions = [Incident.created_at >= day_start, Incident.created_at < day_end]
        resolved_conditions = [
            Incident.resolved_at.is_not(None),
            Incident.resolved_at >= day_start,
            Incident.resolved_at < day_end,
        ]
        if query.service_id is not None:
            created_conditions.append(Incident.service_id == query.service_id)
            resolved_conditions.append(Incident.service_id == query.service_id)

        total = db.scalar(select(func.count()).select_from(Incident).where(*created_conditions)) or 0
        critical = (
            db.scalar(
                select(func.count())
                .select_from(Incident)
                .where(
                    *created_conditions,
                    Incident.severity == IncidentSeverity.critical.value,
                )
            )
            or 0
        )
        resolved = (
            db.scalar(select(func.count()).select_from(Incident).where(*resolved_conditions)) or 0
        )

        trend.append(
            IncidentTrendDataPoint(
                date=day.isoformat(),
                label=_format_date_label(day),
                total=total,
                critical=critical,
                resolved=resolved,
            )
        )

    return trend


def _build_response_time_series(
    incidents: list[Incident],
    dates: list[date],
) -> list[ResponseTimeDataPoint]:
    return [
        ResponseTimeDataPoint(
            date=day.isoformat(),
            label=_format_date_label(day),
            response_time=round(_estimate_daily_response_time(incidents, day), 1),
        )
        for day in dates
    ]


def _build_service_performance(
    db: Session,
    services: list[Service],
    range_start: datetime,
    range_end: datetime,
) -> list[ServicePerformanceRow]:
    rows: list[ServicePerformanceRow] = []

    for service in services:
        incident_count = (
            db.scalar(
                select(func.count())
                .select_from(Incident)
                .where(
                    Incident.service_id == service.id,
                    Incident.created_at >= range_start,
                    Incident.created_at < range_end,
                )
            )
            or 0
        )
        rows.append(
            ServicePerformanceRow(
                service_id=service.id,
                service_name=service.name,
                uptime=_decimal_to_float(service.uptime),
                response_time=STATUS_RESPONSE_TIME_MS.get(service.status, 45.0),
                incident_count=incident_count,
            )
        )

    rows.sort(key=lambda row: row.uptime, reverse=True)
    return rows


def _compute_mttr(
    db: Session,
    query: AnalyticsOverviewQuery,
    range_start: datetime,
    range_end: datetime,
) -> str:
    conditions = [
        Incident.resolved_at.is_not(None),
        Incident.resolved_at >= range_start,
        Incident.resolved_at < range_end,
        Incident.status == IncidentStatus.resolved.value,
    ]
    if query.service_id is not None:
        conditions.append(Incident.service_id == query.service_id)

    resolved_incidents = list(db.scalars(select(Incident).where(*conditions)).all())
    if not resolved_incidents:
        return "0m"

    total_seconds = sum(
        (incident.resolved_at - incident.started_at).total_seconds()
        for incident in resolved_incidents
        if incident.resolved_at is not None
    )
    average_seconds = total_seconds / len(resolved_incidents)
    return _format_mttr(average_seconds)


def _compute_kpis(
    db: Session,
    query: AnalyticsOverviewQuery,
    services: list[Service],
    incidents: list[Incident],
    response_time_series: list[ResponseTimeDataPoint],
    range_start: datetime,
    range_end: datetime,
) -> AnalyticsKpis:
    if services:
        overall_uptime = sum(_decimal_to_float(service.uptime) for service in services) / len(
            services
        )
    else:
        overall_uptime = 100.0

    if response_time_series:
        average_response_time = sum(point.response_time for point in response_time_series) / len(
            response_time_series
        )
    else:
        average_response_time = 45.0

    alert_conditions = _alert_filters(query, range_start, range_end)
    alert_volume = db.scalar(select(func.count()).select_from(Alert).where(*alert_conditions)) or 0

    return AnalyticsKpis(
        overall_uptime=_format_uptime(overall_uptime),
        average_response_time=_format_response_time(average_response_time),
        total_incidents=len(incidents),
        mttr=_compute_mttr(db, query, range_start, range_end),
        alert_volume=alert_volume,
    )


def get_analytics_overview(
    db: Session,
    query: AnalyticsOverviewQuery,
) -> AnalyticsOverviewResponse:
    start_day, end_day = _date_bounds(query.date_range)
    dates = _iter_dates(start_day, end_day)
    range_start = datetime.combine(start_day, datetime.min.time(), tzinfo=timezone.utc)
    range_end = datetime.combine(
        end_day + timedelta(days=1),
        datetime.min.time(),
        tzinfo=timezone.utc,
    )

    services = _load_services(db, query)
    incidents = _load_incidents_in_range(db, query, range_start, range_end)
    uptime_series = _build_uptime_series(services, incidents, dates)
    incident_trend = _build_incident_trend(db, query, dates)
    response_time_series = _build_response_time_series(incidents, dates)
    service_performance = _build_service_performance(db, services, range_start, range_end)
    kpis = _compute_kpis(
        db,
        query,
        services,
        incidents,
        response_time_series,
        range_start,
        range_end,
    )

    return AnalyticsOverviewResponse(
        date_range=query.date_range,
        service_id=query.service_id,
        kpis=kpis,
        uptime_series=uptime_series,
        incident_trend=incident_trend,
        response_time_series=response_time_series,
        service_performance=service_performance,
    )
