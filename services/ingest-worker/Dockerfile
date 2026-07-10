FROM python:3.12.13-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.11.28 /uv /uvx /bin/
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    WORKER_HOST=0.0.0.0 \
    WORKER_HEALTH_PORT=8091

EXPOSE 8091
CMD ["loura-ingest-worker"]
