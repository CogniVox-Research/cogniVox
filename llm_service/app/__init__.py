import asyncio
from contextlib import asynccontextmanager
import typing

from .config import config

__all__ = ["app", "config"]

from fastapi import FastAPI
from shared import rabbitmq, rpc


class DocumentService(rpc.RPCInterface):
    async def get_transcript(self, session_id: str) -> typing.Any: ...


document_server: DocumentService = None  # pyright: ignore[reportAssignmentType]


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.rpc_handler import LLMRPCServer

    global document_server

    async with rabbitmq.connect(config.rabbitmq_url) as channel:
        async with rpc.RPCClient(channel) as client:
            document_server = client.get_server("document-server", DocumentService)
            server = rpc.RPCServer("llm-server", channel, LLMRPCServer(document_server))
            async with server:
                yield


app = FastAPI()

print(config)
