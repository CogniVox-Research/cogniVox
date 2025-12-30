import asyncio
import logging
import typing
import uuid

from functools import partial
from typing import MutableMapping


from aio_pika import Message
from aio_pika.abc import AbstractChannel, AbstractIncomingMessage
import pydantic


class _RPCMessage(pydantic.BaseModel):
    fn: str
    data: typing.Any


class _RPCResponse(pydantic.BaseModel):
    ok: bool
    data: typing.Any


class RPCException(Exception):
    def __init__(self, msg: str) -> None:
        super().__init__(msg)
        self.msg = msg


class RPCInterface(typing.Protocol):
    pass


class RPCServer:
    def __init__(
        self, name: str, channel: AbstractChannel, handler: RPCInterface
    ) -> None:
        self.channel = channel
        self.name = name
        self.handler = handler

    async def start_server(self):
        queue = await self.channel.declare_queue(self.name)
        async with queue.iterator() as qiterator:
            message: AbstractIncomingMessage

            async for message in qiterator:
                try:
                    async with message.process(requeue=False):
                        assert message.reply_to is not None

                        request = _RPCMessage.model_validate_json(message.body.decode())

                        if hasattr(self.handler, request.fn):
                            handler = getattr(self.handler, request.fn)
                            try:
                                response = await handler(request.data)
                            except Exception as e:
                                logging.getLogger().error(
                                    "error in rpc call", exc_info=True
                                )
                                response = RPCException(
                                    f"An exception occured while handling RPC: {e}"
                                )

                        else:
                            response = _RPCResponse(
                                ok=False, data=RPCException("method not found")
                            )

                        await queue.channel.default_exchange.publish(
                            Message(
                                body=_RPCResponse(
                                    data=response,
                                    ok=not isinstance(response, RPCException),
                                )
                                .model_dump_json()
                                .encode(),
                                correlation_id=message.correlation_id,
                            ),
                            routing_key=message.reply_to,
                        )

                except Exception:
                    logging.exception("Processing error for message %r", message)


class RPCClient:
    def __init__(self, channel: AbstractChannel) -> None:
        self.futures: MutableMapping[str, asyncio.Future] = {}
        self.channel = channel

    async def __aenter__(self) -> typing.Self:
        self.callback_queue = await self.channel.declare_queue(exclusive=True)
        self.consume_tag = await self.callback_queue.consume(
            self.__on_response, no_ack=True
        )
        return self

    async def __aexit__(self, *arg):
        await self.callback_queue.cancel(self.consume_tag)

    async def __on_response(self, message: AbstractIncomingMessage) -> None:
        if message.correlation_id is None:
            print(f"Bad message {message!r}")

            return

        future: asyncio.Future = self.futures.pop(message.correlation_id)

        future.set_result(message.body)

    async def get_server[T: RPCInterface](self, name: str, proto: typing.Type[T]):
        return typing.cast(T, _RpcCaller(self, name, proto))

    async def _call(self, routing_key: str, fn: str, data: typing.Any) -> typing.Any:
        correlation_id = str(uuid.uuid4())

        loop = asyncio.get_running_loop()

        future = loop.create_future()

        self.futures[correlation_id] = future

        await self.channel.default_exchange.publish(
            Message(
                _RPCMessage(fn=fn, data=data).model_dump_json().encode(),
                content_type="text/plain",
                correlation_id=correlation_id,
                reply_to=self.callback_queue.name,
            ),
            routing_key=routing_key,
        )

        response = _RPCResponse.model_validate_json(await future)
        if not response.ok:
            raise RPCException(response.data)

        return response.data


class _RpcCaller:
    def __init__(
        self, client: RPCClient, name: str, proto: typing.Type[RPCInterface]
    ) -> None:
        self._client = client
        self._proto = proto
        self._name = name

    def __getattribute__(self, name: str) -> typing.Any:
        if name.startswith("_"):
            return super().__getattribute__(name)

        if hasattr(self._proto, name):
            return partial(self._client._call, self._name, name)

        return super().__getattribute__(name)


# class Test(RPCInterface):
#     async def test_fn(self, data: typing.Any):
#         pass


# class TestServer(RPCServer):
#     async def rpc_test_fn(self, data: typing.Any):
#         return f"called {data}"
