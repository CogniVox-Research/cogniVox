import asyncio
from contextlib import asynccontextmanager
import json

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from whisperlivekit.audio_processor import FrontData
import aio_pika

from .asr import ASREngine
from .config import config


transcription_engine = ASREngine()
channel: aio_pika.abc.AbstractChannel | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global channel
    transcription_engine.init()

    connection = await aio_pika.connect_robust(
        config.rabbitmq_url, loop=asyncio.get_event_loop()
    )
    await connection.connect()
    # Creating channel
    channel = await connection.channel()

    # Declaring queue
    await channel.declare_queue("ASR_stream", auto_delete=False)
    await channel.declare_queue("ASR", auto_delete=False)
    yield
    await channel.close()
    await connection.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "FastAPI is running"}


@app.websocket("/audio/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    async def transcribe_cb(data: FrontData):
        assert channel is not None, "RabbitMQ channel is not initialized"
        await channel.default_exchange.publish(
            aio_pika.Message(body=json.dumps(data.to_dict()).encode()),
            routing_key="ASR_stream",
        )

    async def complete_cb(data: str):
        assert channel is not None, "RabbitMQ channel is not initialized"
        await channel.default_exchange.publish(
            aio_pika.Message(body="".join(data).encode()),
            routing_key="ASR",
        )

    await transcription_engine.start_session(
        session_id, websocket, transcribe_cb, complete_cb
    )
