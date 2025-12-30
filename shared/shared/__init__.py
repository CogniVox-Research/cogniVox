import asyncio
from contextlib import asynccontextmanager

from aio_pika import connect_robust

from . import rpc
from .config import SharedBaseSettings

__all__ = ["SharedBaseSettings", "rpc"]


@asynccontextmanager
async def rabbitmq_connect(rabbitmq_url: str):
    connection = await connect_robust(rabbitmq_url, loop=asyncio.get_event_loop())
    await connection.connect()
    try:
        yield await connection.channel()
    finally:
        await connection.close()
