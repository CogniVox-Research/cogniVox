FROM python:3.10-slim AS build-base
WORKDIR /app
RUN pip install --no-cache-dir poetry
RUN poetry config virtualenvs.create false

FROM build-base
ENV SERVICE_NAME=services/llm
WORKDIR /app/$SERVICE_NAME
COPY $SERVICE_NAME/poetry.lock ./poetry.lock
COPY $SERVICE_NAME/pyproject.toml ./pyproject.toml
RUN poetry install --no-interaction --no-ansi --no-root

COPY $SERVICE_NAME/ .
EXPOSE 8030

CMD ["python", "main.py"]
