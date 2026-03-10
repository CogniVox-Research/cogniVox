import asyncio
import json
import traceback
from contextlib import asynccontextmanager

import aio_pika
from aio_pika.abc import AbstractChannel
from shared import rabbitmq

from .config import config
from .detector import detector
from .dto import ASRData, MQData, UnstuckDetection

__all__ = ["app", "config"]

from fastapi import FastAPI


async def read_queue(conn: AbstractChannel):
    queue_reader = await rabbitmq.read_queue(conn, None, MQData, "asr", "#")
    output = await conn.get_exchange("results")

    async def _task():
        async for data in queue_reader:
            data = data.data
            asyncio.create_task(handle_message(data))

    async def handle_message(data: ASRData):
        try:
            if data.session_type and data.session_type == "answer":
                return

            detection = await detector.detect_stuck(data)
            if detection is None:
                return

            print(detection)

            if isinstance(detection, UnstuckDetection):
                msg = {
                    "type": "unstuck",
                }

            elif not detection.suggestion:
                msg = {
                    "type": "stuck",
                }
            else:
                msg = {
                    "type": "stuck_suggestion",
                    "data": detection.suggestion,
                }
            await output.publish(
                aio_pika.Message(body=json.dumps(msg).encode()),
                routing_key=data.session_id,
                mandatory=False,
            )
        except Exception as e:
            print(e)
            traceback.print_exc()

    return asyncio.create_task(_task())


@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm_server
    async with rabbitmq.connect(config.rabbitmq_url) as con:
        task = await read_queue(con)
        yield
        task.cancel()


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def main():
    return "Running"
