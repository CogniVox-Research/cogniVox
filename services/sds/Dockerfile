FROM python:3.13-slim AS build-base
WORKDIR /app
RUN pip install --no-cache-dir poetry==2.3.2
RUN poetry config virtualenvs.create false
RUN apt update
RUN apt install ffmpeg -y

FROM build-base
WORKDIR /app
COPY lib/shared/ ./lib/shared/
ENV SERIVCE_NAME=services/sds
WORKDIR /app/$SERIVCE_NAME
COPY $SERIVCE_NAME/poetry.lock ./poetry.lock
COPY $SERIVCE_NAME/pyproject.toml ./pyproject.toml
RUN --mount=type=cache,target=/root/.cache/pypoetry\
    poetry install --no-interaction --no-ansi
COPY $SERIVCE_NAME/ .
EXPOSE 8006

CMD ["poetry", "run", "fastapi", "run", "--port",  "8006"]
