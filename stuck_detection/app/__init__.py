import asyncio
from contextlib import asynccontextmanager
import json

import aio_pika
from shared import rabbitmq, rpc

from .dto import ASRData, UnstuckDetection
from .config import config
from aio_pika.abc import AbstractChannel
from .detector import detector

__all__ = ["app", "config"]

from fastapi import FastAPI


class LLMService(rpc.RPCInterface):
    async def get_continue_for(self, session_id: str, current_text: str): ...


llm_server: LLMService = None  # pyright: ignore[reportAssignmentType]


async def read_queue(conn: AbstractChannel):
    try:
        queue_reader = rabbitmq.read_queue(conn, "ASR_stream", ASRData)
        async for data in queue_reader:
            detection = await detector.detect_stuck(data)
            if detection is None:
                continue
            print(detection)

            if isinstance(detection, UnstuckDetection):
                await conn.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(
                            {
                                "type": "unstuck_detection",
                                "data": detection.model_dump(),
                            }
                        ).encode()
                    ),
                    routing_key=f"session-{data.session_id}",
                    mandatory=False,
                )
            else:
                await conn.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(
                            {
                                "type": "stuck_detection",
                                "data": detection.model_dump(mode="json"),
                            }
                        ).encode()
                    ),
                    routing_key=f"session-{data.session_id}",
                    mandatory=False,
                )
    except Exception as e:
        print(e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm_server
    async with rabbitmq.connect(config.rabbitmq_url) as con:
        async with rpc.RPCClient(con) as client:
            llm_server = client.get_server("llm-server", LLMService)
            task = asyncio.create_task(read_queue(con))
            yield
            task.cancel()


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def main():
    return "Running"
