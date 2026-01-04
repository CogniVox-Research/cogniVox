from contextlib import asynccontextmanager
from pathlib import Path
import re

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

import aio_pika
from fastapi.responses import FileResponse

from . import dto
from .asr import ASREngine
from .config import config
from shared import lifespan_managed, rabbitmq

transcription_engine = ASREngine()
channel = lifespan_managed(lambda: rabbitmq.connect(config.rabbitmq_url))


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with transcription_engine:
        async with channel:
            # Declaring queue
            await channel.declare_queue("ASR_stream", auto_delete=False)
            await channel.declare_queue("ASR", auto_delete=False)
            await channel.declare_queue("speech_done", auto_delete=False)
            yield


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
    async def transcribe_cb(data: dto.ASRData):
        assert channel is not None, "RabbitMQ channel is not initialized"

        routing_key = "ASR" if data.type == "complete" else "ASR_stream"

        await channel.default_exchange.publish(
            aio_pika.Message(body=data.model_dump_json().encode()),
            routing_key=routing_key,
        )

    await transcription_engine.start_session(session_id, websocket, transcribe_cb)

    await channel.default_exchange.publish(
        aio_pika.Message(
            body=dto.SpeechDone(session_id=session_id).model_dump_json().encode()
        ),
        routing_key="speech_done",
    )


@app.get("/recording/{session_id}")
async def recording_endpoint(session_id: str):
    recording_dir = Path(config.recording_dir).absolute()
    clean_session_id = re.sub(r"[/\\?%*:|\"<>\x7F\x00-\x1F]", "-", session_id)

    file_name = f"{clean_session_id}.wav"
    recording_file = recording_dir / file_name
    return FileResponse(
        path=recording_file,
        filename=file_name,
        media_type="audio/vnd.wave",
    )
