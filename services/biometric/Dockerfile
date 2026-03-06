FROM python:3.13-slim AS build-base
WORKDIR /app
RUN pip install --no-cache-dir poetry==2.3.2
RUN poetry config virtualenvs.create false

FROM build-base
COPY shared/ ./shared/
ENV SERIVCE_NAME=biometric_service
WORKDIR /app/$SERIVCE_NAME
COPY $SERIVCE_NAME/poetry.lock ./poetry.lock
COPY $SERIVCE_NAME/pyproject.toml ./pyproject.toml
RUN poetry install --no-interaction --no-ansi
COPY $SERIVCE_NAME/ .
EXPOSE 9010

CMD ["poetry", "run", "fastapi", "run", "--port", "9010"]
