from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.analytics_range import AnalyticsDateRange
from app.db.session import get_db
from app.schemas.analytics import AnalyticsOverviewQuery, AnalyticsOverviewResponse
from app.services import analytics_service

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    db: Session = Depends(get_db),
    date_range: AnalyticsDateRange = AnalyticsDateRange.seven_days,
    service_id: int | None = Query(default=None, gt=0),
):
    query = AnalyticsOverviewQuery(date_range=date_range, service_id=service_id)
    return analytics_service.get_analytics_overview(db, query)
