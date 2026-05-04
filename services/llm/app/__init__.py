from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="LLM Service",
    description="Interview Question Generator using Gemini AI",
    version="0.1.0",
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="LLM Service",
        version="0.1.0",
        description="Interview Question Generator using Gemini AI",
        routes=app.routes,
    )

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Import routes after app initialization to avoid circular imports
from app.routes import router

app.include_router(router, prefix="/api/v1")
