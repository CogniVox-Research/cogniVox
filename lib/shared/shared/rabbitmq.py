import abc
import asyncio
import json
import logging
import typing
from asyncio.tasks import Task
from contextlib import asynccontextmanager
from dataclasses import dataclass
from traceback import print_exc
from warnings import deprecated

import aio_pika
import pydantic
from aio_pika import connect_robust
from aio_pika.abc import AbstractChannel, AbstractIncomingMessage
from aiormq import AMQPConnectionError, ChannelNotFoundEntity


class Config(pydantic.BaseModel):
    url: str


@dataclass
class Message:
    data: typing.Any
    routing_key: str


class QueueListener[M: pydantic.BaseModel](abc.ABC):
    def __init__(
        self,
        config: Config,
        queue_name: str | None,
        message_type: typing.Type[M],
        exchange: str = "",
        routing_key: str | None = None,
        response_exchange: str = "",
    ):
        self.__rabbitmq_url = config.url
        self.__queue_name = queue_name
        self.__exchange = exchange
        self.__routing_key = routing_key
        self.__msg_clazz = message_type
        self.__response_exchange = response_exchange
        self.__instance: Task[None] | None = None

    @abc.abstractmethod
    async def handle_message(self, message: M) -> Message | None:
        pass

    async def _run(self):
        async with connect(self.__rabbitmq_url) as channel:
            queue_reader = await read_queue(
                channel,
                queue_name=self.__queue_name,
                msg_type=self.__msg_clazz,
                exchange=self.__exchange,
                routing_key=None,
            )
            response_exchange = await channel.get_exchange(self.__response_exchange)

            async for message in queue_reader:

                async def _handle_message():
                    try:
                        response = await self.handle_message(message)
                    except Exception as e:
                        print(f"Failed to respond to {message}")
                        print(e)
                        print_exc()
                        return

                    if response is None:
                        return

                    response_json = json.dumps(response.data).encode()

                    await response_exchange.publish(
                        aio_pika.Message(body=response_json),
                        routing_key=response.routing_key,
                    )

                asyncio.create_task(_handle_message())

    def __enter__(self):
        if self.__instance is not None:
            raise RuntimeError("Started multiple times")
        self.__instance = asyncio.create_task(self._run())

    def __exit__(self, *args, **kwargs):
        assert self.__instance is not None

        self.__instance.cancel()


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
