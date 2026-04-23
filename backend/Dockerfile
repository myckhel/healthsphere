FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  UV_LINK_MODE=copy

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential curl \
  && rm -rf /var/lib/apt/lists/* \
  && pip install --no-cache-dir uv

WORKDIR /app

COPY pyproject.toml requirements.txt uv.lock ./

FROM base AS dev

RUN uv sync --frozen

COPY . .

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS prod

RUN uv sync --frozen --no-dev

COPY . .

CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
