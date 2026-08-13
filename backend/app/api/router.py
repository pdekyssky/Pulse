from fastapi import APIRouter

from app.api import (
    alerts,
    analytics,
    audit_logs,
    auth,
    dashboard,
    incidents,
    notifications,
    services,
    timeline,
    users,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"],
)

api_router.include_router(
    incidents.router,
    prefix="/incidents",
    tags=["incidents"],
)

api_router.include_router(
    services.router,
    prefix="/services",
    tags=["services"],
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"],
)

api_router.include_router(
    alerts.router,
    prefix="/alerts",
    tags=["alerts"],
)

api_router.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["dashboard"],
)

api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"],
)

api_router.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["notifications"],
)

api_router.include_router(
    audit_logs.router,
    prefix="/audit-logs",
    tags=["audit-logs"],
)

api_router.include_router(
    timeline.router,
    prefix="/timeline",
    tags=["timeline"],
)
