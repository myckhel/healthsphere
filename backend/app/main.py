from __future__ import annotations

import hashlib
import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine
from app.core.errors import build_error_content, http_error_code
from app.core.logging import configure_logging
from app.core.monitoring import default_monitoring_service

configure_logging(settings.debug)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    started_at = time.perf_counter()
    actor_id = request.headers.get(settings.stub_auth_header, "anonymous")
    actor_hash = hashlib.sha256(actor_id.encode("utf-8")).hexdigest()[:12]
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        default_monitoring_service.record_request(
            method=request.method,
            path=request.url.path,
            status_code=status_code,
            duration_ms=duration_ms,
        )
        logger.info(
            "request_completed method=%s path=%s status=%s actor_hash=%s actor_role=%s clinic_present=%s request_id=%s duration_ms=%s",
            request.method,
            request.url.path,
            status_code,
            actor_hash,
            request.headers.get(settings.stub_role_header, "unknown"),
            bool(request.headers.get(settings.stub_clinic_header)),
            request_id,
            duration_ms,
        )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content=build_error_content(
            code="validation_error",
            message="Request validation failed",
            request_id=request_id,
            details=exc.errors(),
        ),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request_id = getattr(request.state, "request_id", None)
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_content(
            code=http_error_code(exc.status_code),
            message=message,
            request_id=request_id,
        ),
    )


app.include_router(api_router)
