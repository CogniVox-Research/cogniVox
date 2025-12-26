import json
import typing
from fastapi import WebSocket, WebSocketDisconnect
from . import logger


class WebSocketError(Exception):
    def __init__(self, message: str):
        super().__init__(message)


async def websocket_reader(websocket: WebSocket) -> typing.AsyncGenerator[bytes, None]:
    """Asynchronously reads binary messages from a WebSocket."""
    try:
        while True:
            message = await websocket.receive_bytes()
            if b"STOP" in message:
                logger.info("Received end from client")
                break
            yield message

    except WebSocketDisconnect:
        raise WebSocketError("WebSocket disconnected without sending STOP signal.")
    except Exception as e:
        raise WebSocketError("Error reading from WebSocket ") from e


def websocket_writer(
    websocket: WebSocket,
) -> typing.Callable[[typing.Any], typing.Awaitable[None]]:
    """Returns a function that sends binary messages to a WebSocket."""

    async def send_message(message: typing.Any):
        try:
            await websocket.send_bytes(json.dumps(message).encode("utf-8"))
        except Exception as e:
            raise WebSocketError("Error writing to WebSocket ") from e

    return send_message
