import asyncio
from contextlib import asynccontextmanager
import json

import aio_pika
from shared import rabbitmq

from .dto import ASRData, UnstuckDetection
from .config import config
from aio_pika.abc import AbstractChannel
from .detector import detector

__all__ = ["app", "config"]

from fastapi import FastAPI


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
    async with rabbitmq.connect(config.rabbitmq_url) as con:
        task = asyncio.create_task(read_queue(con))
        yield
        task.cancel()


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def main():
    return "Running"
