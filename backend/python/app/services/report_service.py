import math
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.alert_status import AlertStatus
from app.core.analytics_range import AnalyticsDateRange
from app.core.incident_severity import IncidentSeverity
from app.core.incident_status import IncidentStatus
from app.core.report_type import (
    REPORT_PERIOD_DAYS,
    REPORT_TYPE_LABELS,
    ReportPeriodFilter,
    ReportStatus,
    ReportType,
)
from app.core.service_status import ServiceStatus
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.service import Service
from app.models.user import User
from app.schemas.analytics import AnalyticsOverviewQuery
from app.schemas.report import (
    PaginatedReportResponse,
    ReportListQuery,
    ReportMetricResponse,
    ReportResponse,
    ReportStatsResponse,
)
from app.services import analytics_service


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _period_bounds(days: int) -> tuple[datetime, datetime, date, date]:
    end_day = _utc_now().date()
    start_day = end_day - timedelta(days=days - 1)
    range_start = datetime.combine(start_day, datetime.min.time(), tzinfo=timezone.utc)
    range_end = datetime.combine(
        end_day + timedelta(days=1),
        datetime.min.time(),
        tzinfo=timezone.utc,
    )
    period_start = datetime.combine(start_day, datetime.min.time(), tzinfo=timezone.utc)
    period_end = datetime.combine(end_day, datetime.max.time(), tzinfo=timezone.utc)
    return range_start, range_end, start_day, end_day, period_start, period_end


def _days_to_analytics_range(days: int) -> AnalyticsDateRange:
    if days <= 7:
        return AnalyticsDateRange.seven_days
    if days <= 14:
        return AnalyticsDateRange.fourteen_days
    return AnalyticsDateRange.thirty_days


def _default_generated_by_id(db: Session) -> int:
    admin = db.scalar(select(User.id).where(User.role == "admin").order_by(User.id).limit(1))
    if admin is not None:
        return admin
    fallback = db.scalar(select(User.id).order_by(User.id).limit(1))
    return fallback or 1


def _incident_counts(
    db: Session,
    range_start: datetime,
    range_end: datetime,
    service_id: int | None,
) -> tuple[int, int, int]:
    base_conditions = [
        Incident.created_at >= range_start,
        Incident.created_at < range_end,
    ]
    if service_id is not None:
        base_conditions.append(Incident.service_id == service_id)

    total = db.scalar(select(func.count()).select_from(Incident).where(*base_conditions)) or 0
    active = (
        db.scalar(
            select(func.count())
            .select_from(Incident)
            .where(
                *base_conditions,
                Incident.status != IncidentStatus.resolved.value,
            )
        )
        or 0
    )
    resolved = (
        db.scalar(
            select(func.count())
            .select_from(Incident)
            .where(
                *base_conditions,
                Incident.status == IncidentStatus.resolved.value,
            )
        )
        or 0
    )
    return total, active, resolved


def _alert_counts(
    db: Session,
    range_start: datetime,
    range_end: datetime,
    service_id: int | None,
) -> tuple[int, int, int, int]:
    base_conditions = [
        Alert.created_at >= range_start,
        Alert.created_at < range_end,
    ]
    if service_id is not None:
        base_conditions.append(Alert.service_id == service_id)

    total = db.scalar(select(func.count()).select_from(Alert).where(*base_conditions)) or 0
    critical = (
        db.scalar(
            select(func.count())
            .select_from(Alert)
            .where(*base_conditions, Alert.severity == IncidentSeverity.critical.value)
        )
        or 0
    )
    acknowledged = (
        db.scalar(
            select(func.count())
            .select_from(Alert)
            .where(*base_conditions, Alert.status == AlertStatus.acknowledged.value)
        )
        or 0
    )
    resolved = (
        db.scalar(
            select(func.count())
            .select_from(Alert)
            .where(*base_conditions, Alert.status == AlertStatus.resolved.value)
        )
        or 0
    )
    return total, critical, acknowledged, resolved


def _build_incident_summary_report(
    db: Session,
    days: int,
    service: Service | None,
    generated_by_id: int,
) -> ReportResponse:
    range_start, range_end, _, _, period_start, period_end = _period_bounds(days)
    analytics = analytics_service.get_analytics_overview(
        db,
        AnalyticsOverviewQuery(
            date_range=_days_to_analytics_range(days),
            service_id=service.id if service else None,
        ),
    )
    total, active, resolved = _incident_counts(
        db,
        range_start,
        range_end,
        service.id if service else None,
    )
    scope = service.name if service else "All services"
    type_label = REPORT_TYPE_LABELS[ReportType.incident_summary]
    suffix = f" - {service.name}" if service else ""
    return ReportResponse(
        id=f"incident_summary-{days}d-{service.id if service else 'all'}",
        name=f"Last {days} Days {type_label}{suffix}",
        type=ReportType.incident_summary,
        period_start=period_start,
        period_end=period_end,
        created_at=period_end,
        status=ReportStatus.completed,
        generated_by_id=generated_by_id,
        summary=(
            f"{total} incident(s) recorded during the reporting period. "
            f"{resolved} resolved and {active} remain active."
        ),
        scope=scope,
        service_ids=[service.id] if service else None,
        metrics=[
            ReportMetricResponse(label="Total Incidents", value=str(total)),
            ReportMetricResponse(label="Resolved", value=str(resolved)),
            ReportMetricResponse(label="Active", value=str(active)),
            ReportMetricResponse(label="Mean Time to Resolve", value=analytics.kpis.mttr),
        ],
    )


def _build_service_availability_report(
    db: Session,
    days: int,
    service: Service | None,
    generated_by_id: int,
) -> ReportResponse:
    range_start, range_end, _, _, period_start, period_end = _period_bounds(days)
    analytics = analytics_service.get_analytics_overview(
        db,
        AnalyticsOverviewQuery(
            date_range=_days_to_analytics_range(days),
            service_id=service.id if service else None,
        ),
    )

    if service:
        services = [service]
        scope = service.name
    else:
        services = list(db.scalars(select(Service).order_by(Service.name)).all())
        scope = "All services"

    degraded_events = sum(1 for item in services if item.status == ServiceStatus.degraded.value)
    outage_events = sum(
        1
        for item in services
        if item.status
        in {ServiceStatus.partial_outage.value, ServiceStatus.major_outage.value}
    )

    suffix = f" - {service.name}" if service else ""
    return ReportResponse(
        id=f"service_availability-{days}d-{service.id if service else 'all'}",
        name=f"Last {days} Days Service Availability{suffix}",
        type=ReportType.service_availability,
        period_start=period_start,
        period_end=period_end,
        created_at=period_end,
        status=ReportStatus.completed,
        generated_by_id=generated_by_id,
        summary=(
            f"Platform uptime averaged {analytics.kpis.overall_uptime} across "
            f"{len(services)} monitored service(s)."
        ),
        scope=scope,
        service_ids=[service.id] if service else None,
        metrics=[
            ReportMetricResponse(label="Average Uptime", value=analytics.kpis.overall_uptime),
            ReportMetricResponse(label="Services Monitored", value=str(len(services))),
            ReportMetricResponse(label="Degraded Events", value=str(degraded_events)),
            ReportMetricResponse(label="Outage Events", value=str(outage_events)),
        ],
    )


def _build_performance_report(
    db: Session,
    days: int,
    service: Service | None,
    generated_by_id: int,
) -> ReportResponse:
    range_start, range_end, _, _, period_start, period_end = _period_bounds(days)
    analytics = analytics_service.get_analytics_overview(
        db,
        AnalyticsOverviewQuery(
            date_range=_days_to_analytics_range(days),
            service_id=service.id if service else None,
        ),
    )
    performance_rows = analytics.service_performance
    scope = service.name if service else "All services"

    if performance_rows:
        slowest = max(performance_rows, key=lambda row: row.response_time)
        fastest = min(performance_rows, key=lambda row: row.response_time)
        slowest_label = slowest.service_name
        fastest_label = fastest.service_name
    else:
        slowest_label = "N/A"
        fastest_label = "N/A"

    suffix = f" - {service.name}" if service else ""
    return ReportResponse(
        id=f"performance-{days}d-{service.id if service else 'all'}",
        name=f"Last {days} Days Performance Report{suffix}",
        type=ReportType.performance,
        period_start=period_start,
        period_end=period_end,
        created_at=period_end,
        status=ReportStatus.completed,
        generated_by_id=generated_by_id,
        summary=(
            f"Average response time was {analytics.kpis.average_response_time} "
            f"over the selected period."
        ),
        scope=scope,
        service_ids=[service.id] if service else None,
        metrics=[
            ReportMetricResponse(
                label="Avg Response Time",
                value=analytics.kpis.average_response_time,
            ),
            ReportMetricResponse(label="Slowest Service", value=slowest_label),
            ReportMetricResponse(label="Fastest Service", value=fastest_label),
            ReportMetricResponse(label="Services Analyzed", value=str(len(performance_rows))),
        ],
    )


def _build_alert_summary_report(
    db: Session,
    days: int,
    service: Service | None,
    generated_by_id: int,
) -> ReportResponse:
    range_start, range_end, _, _, period_start, period_end = _period_bounds(days)
    total, critical, acknowledged, resolved = _alert_counts(
        db,
        range_start,
        range_end,
        service.id if service else None,
    )
    scope = service.name if service else "All services"
    suffix = f" - {service.name}" if service else ""
    return ReportResponse(
        id=f"alert_summary-{days}d-{service.id if service else 'all'}",
        name=f"Last {days} Days Alert Summary{suffix}",
        type=ReportType.alert_summary,
        period_start=period_start,
        period_end=period_end,
        created_at=period_end,
        status=ReportStatus.completed,
        generated_by_id=generated_by_id,
        summary=f"{total} alert(s) were recorded during the reporting period.",
        scope=scope,
        service_ids=[service.id] if service else None,
        metrics=[
            ReportMetricResponse(label="Total Alerts", value=str(total)),
            ReportMetricResponse(label="Critical", value=str(critical)),
            ReportMetricResponse(label="Acknowledged", value=str(acknowledged)),
            ReportMetricResponse(label="Resolved", value=str(resolved)),
        ],
    )


def _build_monthly_operations_report(
    db: Session,
    days: int,
    generated_by_id: int,
) -> ReportResponse:
    range_start, range_end, _, _, period_start, period_end = _period_bounds(days)
    analytics = analytics_service.get_analytics_overview(
        db,
        AnalyticsOverviewQuery(date_range=_days_to_analytics_range(days)),
    )
    services = list(db.scalars(select(Service)).all())
    return ReportResponse(
        id=f"monthly_operations-{days}d-all",
        name=f"Last {days} Days Operations Report",
        type=ReportType.monthly_operations,
        period_start=period_start,
        period_end=period_end,
        created_at=period_end,
        status=ReportStatus.completed,
        generated_by_id=generated_by_id,
        summary=(
            "Operations review covering incidents, service health, and alert activity "
            "for the selected period."
        ),
        scope="All services",
        metrics=[
            ReportMetricResponse(label="Incidents", value=str(analytics.kpis.total_incidents)),
            ReportMetricResponse(label="Avg Uptime", value=analytics.kpis.overall_uptime),
            ReportMetricResponse(label="Alerts Fired", value=str(analytics.kpis.alert_volume)),
            ReportMetricResponse(label="Services Monitored", value=str(len(services))),
        ],
    )


def _generate_all_reports(db: Session) -> list[ReportResponse]:
    generated_by_id = _default_generated_by_id(db)
    services = list(db.scalars(select(Service).order_by(Service.name)).all())
    reports: list[ReportResponse] = []

    for days in (7, 30, 90):
        reports.append(_build_incident_summary_report(db, days, None, generated_by_id))
        reports.append(_build_service_availability_report(db, days, None, generated_by_id))
        reports.append(_build_alert_summary_report(db, days, None, generated_by_id))
        if days in (30, 90):
            reports.append(_build_monthly_operations_report(db, days, generated_by_id))

    for days in (7, 30):
        reports.append(_build_performance_report(db, days, None, generated_by_id))

    for service in services:
        reports.append(_build_service_availability_report(db, 7, service, generated_by_id))
        reports.append(_build_performance_report(db, 7, service, generated_by_id))

    reports.sort(key=lambda report: report.created_at, reverse=True)
    return reports


def _matches_search(report: ReportResponse, search: str | None) -> bool:
    if not search:
        return True
    needle = search.lower()
    return (
        needle in report.name.lower()
        or needle in report.summary.lower()
        or needle in report.scope.lower()
    )


def _matches_period_filter(report: ReportResponse, period: ReportPeriodFilter) -> bool:
    if period == ReportPeriodFilter.all:
        return True
    days = REPORT_PERIOD_DAYS[period]
    cutoff = _utc_now() - timedelta(days=days)
    return report.created_at >= cutoff


def _compute_stats(reports: list[ReportResponse]) -> ReportStatsResponse:
    return ReportStatsResponse(
        total=len(reports),
        incident_reports=sum(
            1 for report in reports if report.type == ReportType.incident_summary
        ),
        service_reports=sum(
            1
            for report in reports
            if report.type in {ReportType.service_availability, ReportType.performance}
        ),
        scheduled=sum(1 for report in reports if report.status == ReportStatus.scheduled),
    )


def list_reports(db: Session, query: ReportListQuery) -> PaginatedReportResponse:
    filtered = [
        report
        for report in _generate_all_reports(db)
        if _matches_search(report, query.search)
        and (query.type is None or report.type == query.type)
        and (query.status is None or report.status == query.status)
        and _matches_period_filter(report, query.period)
    ]

    filtered.sort(
        key=lambda report: (
            0 if report.status == ReportStatus.generating else 1,
            report.created_at,
        ),
        reverse=True,
    )

    stats = _compute_stats(filtered)
    total = len(filtered)
    total_pages = math.ceil(total / query.page_size) if total > 0 else 0
    start = (query.page - 1) * query.page_size
    end = start + query.page_size
    items = filtered[start:end]

    return PaginatedReportResponse(
        items=items,
        page=query.page,
        page_size=query.page_size,
        total=total,
        total_pages=total_pages,
        stats=stats,
    )


def get_report_by_id(db: Session, report_id: str) -> ReportResponse:
    for report in _generate_all_reports(db):
        if report.id == report_id:
            return report
    from app.services.exceptions import NotFoundError

    raise NotFoundError("Report", report_id)
