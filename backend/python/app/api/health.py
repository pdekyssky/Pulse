from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Liveness probe: application process is running."""
    return {"status": "ok"}


@router.get("/health/ready")
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe: application can reach PostgreSQL."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "unavailable"},
        )

    return {"status": "ready", "database": "ok"}
