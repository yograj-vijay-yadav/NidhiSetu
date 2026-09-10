"""NidhiSetu FastAPI application.

Error contract: every failure is returned as
    {"error": {"code": "...", "message": "..."}}
Stack traces are never exposed. Swagger UI is served at /docs.
"""

from __future__ import annotations

import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import (
    admin_router,
    ai_router,
    application_router,
    auth_router,
    calculator_router,
    dashboard_router,
    partner_router,
    scheme_router,
)
from app.utils.errors import AppError
from app.utils.logging import configure_logging, get_logger
from app.utils.security import generate_request_id

configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "AI-assisted, RAG-grounded government scheme discovery platform.\n\n"
        "**Deterministic vs AI:** eligibility verdicts, EMI/financing mathematics and "
        "partner filtering are computed by deterministic services — never by an LLM. "
        "The AI layer only interprets intent and narrates pre-computed results, with "
        "deterministic fallbacks whenever Groq is unavailable.\n\n"
        "**Demo data:** scheme rules ship as DEMO/PLACEHOLDER values and are labelled "
        "as such in every response. Verify against official guidelines before applying.\n\n"
        "**Testing via Swagger:** open /docs, expand an endpoint, click *Try it out*, "
        "edit the request body and Execute. Protected endpoints require the "
        "`Authorize` button (JWT bearer token)."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

MAX_BODY_BYTES = settings.request_body_limit_bytes


@app.middleware("http")
async def request_context(request: Request, call_next):
    """Request id + duration logging; enforces a reasonable body size."""
    request_id = generate_request_id()
    request.state.request_id = request_id
    started = time.perf_counter()
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > MAX_BODY_BYTES:
        return JSONResponse(
            status_code=413,
            content={"error": {"code": "PAYLOAD_TOO_LARGE", "message": "Request body too large."}},
        )
    response = await call_next(request)
    duration_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "%s %s -> %s (%.1f ms) [%s]",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request_id,
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.info("AppError %s on %s: %s", exc.code, request.url.path, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", [])[1:]) or "body"
    message = f"Invalid value for '{field}': {first.get('msg', 'validation failed')}"
    code = "VALIDATION_ERROR"
    if field == "category" or "category" in field:
        code = "UNSUPPORTED_CATEGORY"
    if "cost" in field or "income" in field:
        code = "INVALID_AMOUNT"
    logger.info("ValidationError on %s: %s", request.url.path, message)
    return JSONResponse(
        status_code=422,
        content={"error": {"code": code, "message": message}},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    # Log type only; never leak stack traces to clients.
    logger.error("Unhandled error on %s: %s", request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong on our side. Please try again.",
            }
        },
    )


app.include_router(scheme_router.router, prefix="/api/schemes", tags=["Schemes"])
app.include_router(calculator_router.router, prefix="/api/calculator", tags=["Calculator"])
app.include_router(partner_router.router, prefix="/api/partners", tags=["Partners"])
app.include_router(ai_router.router, prefix="/api", tags=["AI Analysis"])
app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(application_router.router, prefix="/api/applications", tags=["Applications"])
app.include_router(dashboard_router.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["Admin"])


@app.get(
    "/health",
    tags=["System"],
    summary="Health check",
)
def health_check() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name, "demo_mode": str(settings.demo_mode).lower()}
