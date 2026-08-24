from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.dashboard import DashboardOverviewResponse
from app.services import dashboard_service

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(db: Session = Depends(get_db)):
    return dashboard_service.get_dashboard_overview(db)
