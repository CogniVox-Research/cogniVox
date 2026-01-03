import asyncio
from contextlib import asynccontextmanager
import typing
from .transcript import SpeechComparer
from .config import config
from .rabbitmq import queue_listener
from pydantic import BaseModel
from shared import rabbitmq, rpc

__all__ = ["app", "config"]

from fastapi import FastAPI


class DocumentService(rpc.RPCInterface):
    async def get_transcript(self, session_id: str) -> typing.Any: ...


document_server: DocumentService = None  # pyright: ignore[reportAssignmentType]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global document_server

    async with rabbitmq.connect(config.rabbitmq_url) as channel:
        async with rpc.RPCClient(channel) as client:
            task = asyncio.create_task(queue_listener(channel))
            document_server = client.get_server("document-server", DocumentService)
            yield

            task.cancel()

            await task


app = FastAPI(lifespan=lifespan)


class SimilarityCheckReq(BaseModel):
    expected_text: str
    speech_text: str


class SimilarityCheckMQReq(BaseModel):
    speech_text: str


@app.post("/")
def check_similarity(req: SimilarityCheckReq):
    comparer = SpeechComparer()
    results = comparer.compare(req.expected_text, req.speech_text)
    return results


@app.post("/{session_id}")
async def check_similarity_with_mq(session_id: str, req: SimilarityCheckMQReq):
    comparer = SpeechComparer()

    response = await document_server.get_transcript(session_id)
    expected_text = response["text"]

    results = comparer.compare(expected_text, req.speech_text)

    return results
