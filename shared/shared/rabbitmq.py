import asyncio
import typing
from contextlib import asynccontextmanager
from warnings import deprecated

from aio_pika import connect_robust
from aio_pika.abc import AbstractChannel, AbstractIncomingMessage
import pydantic


@asynccontextmanager
async def connect(rabbitmq_url: str):
    connection = await connect_robust(rabbitmq_url, loop=asyncio.get_event_loop())
    await connection.connect()
    try:
        yield await connection.channel()
    finally:
        await connection.close()


@deprecated("use rabbitmq.connect instead")
async def rabbitmq_connect(url: str):
    return connect(url)


@typing.overload
async def read_queue[T: pydantic.BaseModel](
    channel: AbstractChannel,
    queue_name: str,
    msg_type: typing.Type[T],
) -> typing.AsyncIterable[T]: ...


@typing.overload
async def read_queue(
    channel: AbstractChannel,
    queue_name: str,
    msg_type: None,
) -> typing.AsyncIterable[AbstractIncomingMessage]: ...


async def read_queue[T: pydantic.BaseModel](
    channel: AbstractChannel,
    queue_name: str,
    msg_type: typing.Type[T] | None = None,
) -> typing.AsyncIterable[T] | typing.AsyncIterable[AbstractIncomingMessage]:
    queue = await channel.declare_queue(queue_name, auto_delete=False)

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                if msg_type is not None:
                    yield msg_type.model_validate_json(message.body)
                else:
                    yield message
