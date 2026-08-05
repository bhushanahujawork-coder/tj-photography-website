import logging
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError

logger = logging.getLogger(__name__)


class AppError(Exception):
    status_code: int = 500
    code: str = "internal_error"
    message: str = "An unexpected error occurred"
    details: Any = None

    def __init__(self, message: str | None = None, code: str | None = None, details: Any = None) -> None:
        if message is not None:
            self.message = message
        if code is not None:
            self.code = code
        self.details = details
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"
    message = "Resource not found"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"
    message = "Resource already exists"


class UnauthorizedError(AppError):
    status_code = 401
    code = "unauthorized"
    message = "Not authenticated"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"
    message = "Permission denied"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"
    message = "Validation failed"


class RateLimitError(AppError):
    status_code = 429
    code = "rate_limit_exceeded"
    message = "Too many requests"


def error_response(status_code: int, code: str, message: str, details: Any = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        },
    )


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.warning(
        "AppError: %s — %s (path: %s)",
        exc.code, exc.message, request.url.path,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s: %s", request.url.path, exc)

    if isinstance(exc, IntegrityError):
        return error_response(409, "conflict", "Database integrity error")

    if isinstance(exc, OperationalError):
        return error_response(503, "service_unavailable", "Database connection error")

    if isinstance(exc, SQLAlchemyError):
        return error_response(500, "database_error", "A database error occurred")

    return error_response(500, "internal_error", "An unexpected error occurred")
