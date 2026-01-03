import asyncio
import logging
import typing
import uuid
import inspect

from functools import partial
from typing import MutableMapping
from warnings import deprecated

from aio_pika import Message
from aio_pika.abc import AbstractChannel, AbstractIncomingMessage
import pydantic

__all__ = ["RPCException", "RPCInterface", "RPCServer", "RPCClient"]


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
        self, name: str, channel: AbstractChannel, handler: typing.Any
    ) -> None:
        self.channel = channel
        self.name = name
        self.handler = handler

    async def __aenter__(self):
        self.queue = await self.channel.declare_queue(self.name)
        self.task = asyncio.create_task(self._start_server())

    async def __aexit__(self, *args):
        self.task.cancel()

    async def run_forever(self):
        await self.task

    async def _respond(self, message: AbstractIncomingMessage, response: typing.Any):
        assert message.reply_to is not None
        await self.queue.channel.default_exchange.publish(
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

    @deprecated("use 'async with' instead")
    async def start_server(self):
        await self.__aenter__()
        await self.task

    async def _start_server(self):
        async with self.queue.iterator() as qiterator:
            message: AbstractIncomingMessage
            async for message in qiterator:
                asyncio.create_task(self._handle_rpc_call(message))

    async def _handle_rpc_call(self, message: AbstractIncomingMessage):
        try:
            async with message.process(requeue=False):
                try:
                    request = _RPCMessage.model_validate_json(message.body.decode())
                except pydantic.ValidationError as e:
                    return await self._respond(
                        message, RPCException(f"Invalid request {e}")
                    )

                if hasattr(self.handler, request.fn):
                    handler = getattr(self.handler, request.fn)
                    try:
                        response = await handler(request.data)
                    except Exception as e:
                        logging.getLogger().error("error in rpc call", exc_info=True)
                        response = RPCException(
                            f"An exception occurred while handling RPC: {e}"
                        )
                else:
                    response = _RPCResponse(
                        ok=False, data=RPCException("method not found")
                    )
                await self._respond(message, response)

        except Exception as e:
            logging.exception("Processing error for message %r", message)
            try:
                await self._respond(
                    message,
                    RPCException(f"An exception occurred while handling RPC: {e}"),
                )
            except Exception:
                logging.exception("Failed to send error response %r", message)


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

    def get_server[T: RPCInterface](self, name: str, proto: typing.Type[T]):
        return typing.cast(T, _RpcCaller(self, name, proto))

    async def _call(
        self,
        routing_key: str,
        fn: str,
        data: typing.Any,
        return_type: typing.Type[pydantic.RootModel] | None = None,
    ) -> typing.Any:
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

        if return_type:
            return return_type(response.data).root

        return response.data


class _RpcCaller:
    def __init__(
        self, client: RPCClient, name: str, proto: typing.Type[RPCInterface]
    ) -> None:
        self._client = client
        self._proto = proto
        self._name = name
        self._methods = {}

    def __getattribute__(self, name: str) -> typing.Any:
        if name.startswith("_"):
            return super().__getattribute__(name)

        cached_methods = super().__getattribute__("_methods")
        if name in cached_methods:
            return cached_methods[name]

        method_def = getattr(self._proto, name, None)
        if not method_def:
            return super().__getattribute__(name)

        signature = inspect.signature(method_def)
        return_type = None
        if signature.return_annotation:
            return_type = pydantic.RootModel[signature.return_annotation]

        param_names = [i for i in signature.parameters.keys()]
        if "self" in param_names:
            param_names.remove("self")

        if len(param_names) == 1:
            param_name = param_names[0]

            async def wrapper(arg):
                return await self._client._call(
                    self._name, name, arg, return_type=return_type
                )

            wrapper.__annotations__ = method_def.__annotations__.copy()
            wrapper.__annotations__["arg"] = wrapper.__annotations__.pop(param_name)

            handler = pydantic.validate_call(
                config=pydantic.ConfigDict(arbitrary_types_allowed=True),
            )(wrapper)

        elif len(param_names) > 1:
            raise RuntimeError("RPC methods can only have one arg")
        else:
            handler = partial(
                self._client._call, self._name, name, return_type=return_type
            )

        cached_methods[name] = handler
        return handler


class TestClient(RPCInterface):
    async def test_fn(self, data: typing.Any) -> int: ...


class TestServer:
    async def test_fn(self, data: typing.Any):
        return 1234


async def test():
    from shared import rabbitmq_connect

    async with rabbitmq_connect("amqp://appuser:apppass@127.0.0.1/") as c:
        server = RPCServer("test-server", c, TestServer())
        server_task = asyncio.create_task(server.start_server())
        async with RPCClient(c) as client:
            test = client.get_server("test-server", TestClient)
            result = await test.test_fn(123)
            print(result)

        server_task.cancel()


if __name__ == "__main__":
    asyncio.run(test())
