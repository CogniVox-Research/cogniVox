import asyncio
import logging
import typing
from contextlib import asynccontextmanager
from logging import Logger
from warnings import deprecated

import pydantic
from aio_pika import connect_robust
from aio_pika.abc import AbstractChannel, AbstractIncomingMessage
from aiormq import AMQPConnectionError, ChannelNotFoundEntity


@asynccontextmanager
async def connect(rabbitmq_url: str):
    while True:
        try:
            connection = await connect_robust(
                rabbitmq_url, loop=asyncio.get_event_loop()
            )
            await connection.connect()
            break
        except KeyboardInterrupt:
            quit(1)
        except AMQPConnectionError:
            logging.root.error(
                f"Failed to connect to rabbitmq at {rabbitmq_url}. Retrying in 5 seconds"
            )
            await asyncio.sleep(5)

    try:
        yield await connection.channel()
    finally:
        await connection.close()


@deprecated("use rabbitmq.connect instead")
def rabbitmq_connect(url: str):
    return connect(url)


@typing.overload
async def read_queue[T: pydantic.BaseModel](
    channel: AbstractChannel,
    queue_name: str | None,
    msg_type: typing.Type[T],
    exchange: str = "",
    routing_key: str | None = None,
) -> typing.AsyncGenerator[T]: ...


@typing.overload
async def read_queue(
    channel: AbstractChannel,
    queue_name: str | None,
    msg_type: None = None,
    exchange: str = "",
    routing_key: str | None = None,
) -> typing.AsyncGenerator[AbstractIncomingMessage]: ...


async def read_queue[T: pydantic.BaseModel](
    channel: AbstractChannel,
    queue_name: str | None,
    msg_type: typing.Type[T] | None = None,
    exchange: str = "",
    routing_key: str | None = None,
) -> typing.AsyncGenerator[T | AbstractIncomingMessage]:
    if exchange:
        while True:
            try:
                exchange_obj = await channel.get_exchange(exchange, ensure=True)
                assert exchange_obj is not None
                break
            except ChannelNotFoundEntity:
                logging.error(
                    f"Exchange {exchange} not create yet. Retrying in 5 seconds"
                )
                await asyncio.sleep(5)

    if queue_name is None:
        queue = await channel.declare_queue(None, exclusive=True, auto_delete=True)
        queue_name = queue.name
        await queue.bind(exchange, routing_key=routing_key)

    queue = await channel.get_queue(queue_name, ensure=True)

    async def _iter():
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    if msg_type is not None:
                        yield msg_type.model_validate_json(message.body)
                    else:
                        yield message

    return _iter()
