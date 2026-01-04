from contextlib import asynccontextmanager

import httpx
from shared import rabbitmq
from app.websocket import SpeechSession
from .config import config
from fastapi.middleware.cors import CORSMiddleware

__all__ = ["app", "config"]

from fastapi import FastAPI, WebSocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with rabbitmq.connect(config.rabbitmq_url) as conn:
        async with httpx.AsyncClient() as client:
            app.state.client = client
            app.state.channel = conn
            yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    ws = SpeechSession(websocket, app.state.client, app.state.channel)
    async with ws:
        await ws.handle_session()
