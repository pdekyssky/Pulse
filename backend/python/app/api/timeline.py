from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.timeline_event_type import TimelineEventType, TimelinePeriod
from app.db.session import get_db
from app.schemas.timeline import PaginatedTimelineResponse, TimelineListQuery
from app.services import timeline_service

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedTimelineResponse)
def list_timeline_events(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    type: TimelineEventType | None = None,
    service_id: int | None = Query(default=None, gt=0),
    incident_id: int | None = Query(default=None, gt=0),
    alert_id: int | None = Query(default=None, gt=0),
    period: TimelinePeriod = TimelinePeriod.all,
):
    query = TimelineListQuery(
        page=page,
        page_size=page_size,
        search=search,
        type=type,
        service_id=service_id,
        incident_id=incident_id,
        alert_id=alert_id,
        period=period,
    )
    return timeline_service.list_timeline_events(db, query)
