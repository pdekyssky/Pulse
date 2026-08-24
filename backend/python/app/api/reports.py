from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.errors import handle_service_error
from app.core.report_type import ReportPeriodFilter, ReportStatus, ReportType
from app.db.session import get_db
from app.schemas.report import PaginatedReportResponse, ReportListQuery, ReportResponse
from app.services import report_service
from app.services.exceptions import NotFoundError

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedReportResponse)
def list_reports(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    type: ReportType | None = None,
    status: ReportStatus | None = None,
    period: ReportPeriodFilter = ReportPeriodFilter.all,
):
    query = ReportListQuery(
        page=page,
        page_size=page_size,
        search=search,
        type=type,
        status=status,
        period=period,
    )
    return report_service.list_reports(db, query)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
):
    try:
        return report_service.get_report_by_id(db, report_id)
    except NotFoundError as exc:
        handle_service_error(exc)
