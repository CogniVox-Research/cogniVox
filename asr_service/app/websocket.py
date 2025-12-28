import json
import typing
from fastapi import WebSocket, WebSocketDisconnect
from . import logger


class WebSocketError(Exception):
    def __init__(self, message: str):
        super().__init__(message)


class AudioWebSocket:
    def __init__(self, websocket: WebSocket):
        self.__websocket = websocket

    async def __aenter__(self):
        await self.__websocket.accept()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        try:
            await self.__websocket.close()
        except:  # noqa: E722
            # ignore error because connection may already be closed
            pass

    async def receive_audio_chunk(self) -> typing.AsyncGenerator[bytes, None]:
        """Returns an async generator that yields audio chunks from the WebSocket."""
        try:
            while True:
                message = await self.__websocket.receive_bytes()
                if b"STOP" in message:
                    logger.info("Received end from client")
                    break
                yield message

        except WebSocketDisconnect:
            raise WebSocketError("WebSocket disconnected without sending STOP signal.")
        except Exception as e:
            raise WebSocketError("Error reading from WebSocket ") from e

    async def send_message(self, message: typing.Any) -> None:
        """Sends a message to the WebSocket."""
        try:
            if isinstance(message, bytes):
                await self.__websocket.send_bytes(message)
            else:
                await self.__websocket.send_text(json.dumps(message))
        except Exception as e:
            raise WebSocketError("Error writing to WebSocket ") from e
