import datetime as dt
import uuid
from collections.abc import AsyncIterator
from unittest.mock import AsyncMock, Mock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.database import engine, get_db
from app.core.monitoring import default_monitoring_service
from app.main import app
from app.services.rate_limit_service import default_rate_limit_service


class ScalarResult:
    def __init__(self, items):
        self._items = items

    def all(self):
        return self._items


class ExecuteResult:
    def __init__(self, items):
        self._items = items

    def all(self):
        return self._items


@pytest_asyncio.fixture(autouse=True)
async def _dispose_async_engine_after_test() -> None:
    yield
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def _clear_rate_limits() -> None:
    default_rate_limit_service.clear()
    yield
    default_rate_limit_service.clear()


@pytest_asyncio.fixture(autouse=True)
async def _clear_monitoring() -> None:
    default_monitoring_service.reset()
    yield
    default_monitoring_service.reset()


@pytest_asyncio.fixture(autouse=True)
async def _disable_live_ai_for_tests() -> None:
    original_api_key = settings.openai_api_key
    original_api_base_url = settings.openai_api_base_url
    settings.openai_api_key = None
    settings.openai_api_base_url = None
    try:
        yield
    finally:
        settings.openai_api_key = original_api_key
        settings.openai_api_base_url = original_api_base_url


@pytest_asyncio.fixture(autouse=True)
async def db_session() -> AsyncIterator[AsyncMock]:
    session = AsyncMock()
    session.scalar.return_value = None
    session.scalars.return_value = ScalarResult([])
    session.execute.return_value = ExecuteResult([])

    added: list[object] = []

    def add_side_effect(item: object) -> None:
        added.append(item)

    async def flush_side_effect() -> None:
        now = dt.datetime.now(dt.timezone.utc)
        for item in added:
            if getattr(item, "id", None) is None:
                item.id = uuid.uuid4()
            if getattr(item, "created_at", None) is None:
                item.created_at = now
            if getattr(item, "updated_at", None) is None:
                item.updated_at = now

    session.add = Mock(side_effect=add_side_effect)
    session.flush.side_effect = flush_side_effect
    session._added = added

    async def override_get_db() -> AsyncIterator[AsyncMock]:
        yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield session
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as async_client:
        yield async_client
