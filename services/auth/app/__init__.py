from contextlib import asynccontextmanager

from app.config import config  # noqa: F401 — triggers key loading on import
from app.database import init_db
from app.routes import router
from fastapi import FastAPI

__all__ = ["app"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="CogniVox Auth Service",
    description="Handles user registration and login. Issues RS256-signed JWTs.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(router)
