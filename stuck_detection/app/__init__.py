import asyncio
from contextlib import asynccontextmanager

from shared import rabbitmq

from .dto import ASRData
from .config import config
from aio_pika.abc import AbstractChannel

__all__ = ["app", "config"]

from fastapi import FastAPI


async def read_queue(conn: AbstractChannel):
    try:
        queue_reader = rabbitmq.read_queue(conn, "ASR_stream", ASRData)
        async for data in queue_reader:
            print(data)
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
