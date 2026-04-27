from __future__ import annotations

import time


class RateLimitService:
    def __init__(self) -> None:
        self._buckets: dict[str, tuple[float, int]] = {}

    def allow(
        self,
        *,
        key: str,
        max_requests: int,
        window_seconds: int,
    ) -> tuple[bool, int]:
        now = time.monotonic()
        window_started_at, count = self._buckets.get(key, (now, 0))
        if now - window_started_at >= float(window_seconds):
            window_started_at, count = now, 0

        count += 1
        self._buckets[key] = (window_started_at, count)
        remaining = max(max_requests - count, 0)
        return count <= max_requests, remaining

    def clear(self) -> None:
        self._buckets.clear()


default_rate_limit_service = RateLimitService()