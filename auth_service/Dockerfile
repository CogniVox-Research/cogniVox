FROM python:3.12-slim AS base

WORKDIR /app

# Install poetry
RUN pip install --no-cache-dir poetry==1.8.3

# Copy shared library first (it's a local dependency)
COPY shared/ ./shared/

# Copy service sources
COPY auth_service/ ./auth_service/

WORKDIR /app/auth_service

# Install dependencies (no dev deps, no virtualenv inside container)
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --without dev

# Keys must be mounted at runtime — never baked into the image
VOLUME ["/app/auth_service/keys"]

EXPOSE 8010

CMD ["python", "main.py"]
