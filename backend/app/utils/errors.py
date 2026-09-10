"""Application error types.

Every API error is returned as structured JSON:
    {"error": {"code": "...", "message": "..."}}
Stack traces are never exposed to clients.
"""

from __future__ import annotations


class AppError(Exception):
    """Base class for all handled application errors."""

    status_code = 500
    code = "INTERNAL_ERROR"

    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code


class DomainValidationError(AppError):
    """A business rule or value domain was violated (HTTP 422)."""

    status_code = 422
    code = "VALIDATION_ERROR"

    def __init__(self, code: str, message: str):
        super().__init__(message, code=code, status_code=422)


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"


class UnauthorizedError(AppError):
    status_code = 401
    code = "UNAUTHORIZED"


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"


class PersistenceError(AppError):
    """MongoDB (or the demo store) is unavailable / failed."""

    status_code = 503
    code = "PERSISTENCE_UNAVAILABLE"
