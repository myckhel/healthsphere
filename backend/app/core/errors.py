from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status


def build_error_content(
    *,
    code: str,
    message: str,
    request_id: str | None,
    details: Any | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "code": code,
        "message": message,
        "request_id": request_id,
    }
    if details is not None:
        payload["details"] = details
    return payload


def http_error_code(status_code: int) -> str:
    return {
        status.HTTP_400_BAD_REQUEST: "bad_request",
        status.HTTP_401_UNAUTHORIZED: "unauthorized",
        status.HTTP_403_FORBIDDEN: "forbidden",
        status.HTTP_404_NOT_FOUND: "not_found",
        status.HTTP_409_CONFLICT: "conflict",
        status.HTTP_422_UNPROCESSABLE_CONTENT: "validation_error",
        status.HTTP_501_NOT_IMPLEMENTED: "not_implemented",
    }.get(status_code, "http_error")


def feature_not_ready(feature_name: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"{feature_name} is scaffolded but not implemented yet.",
    )
