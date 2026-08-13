from fastapi import HTTPException

from app.services.exceptions import ForbiddenError, NotFoundError


def handle_service_error(error: Exception) -> None:
    if isinstance(error, NotFoundError):
        raise HTTPException(status_code=404, detail=str(error)) from error

    if isinstance(error, ForbiddenError):
        raise HTTPException(status_code=403, detail=str(error)) from error

    if isinstance(error, ValueError):
        raise HTTPException(status_code=400, detail=str(error)) from error

    raise error
