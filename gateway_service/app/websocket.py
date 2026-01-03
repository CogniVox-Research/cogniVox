import asyncio
import base64
import json
import typing
import uuid
from fastapi import WebSocket
import httpx
from shared import rabbitmq
import websockets
from aio_pika.abc import AbstractChannel

from app.config import config
from . import logger


class WebSocketError(Exception):
    def __init__(self, message: str):
        super().__init__(message)


class SpeechSession:
    def __init__(
        self, websocket: WebSocket, client: httpx.AsyncClient, channel: AbstractChannel
    ):
        self.__websocket = websocket
        self._session_id = str(uuid.uuid4())
        self._settings = {}
        self._client = client
        self._channel = channel

    async def __aenter__(self):
        await self.__websocket.accept()
        self._queue = await self._channel.declare_queue(
            f"session-{self._session_id}", auto_delete=True, exclusive=True
        )
        self._queue_listen_task = asyncio.create_task(self.queue_listener())
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        try:
            await self.__websocket.close()
            await self._queue.delete()
        except:  # noqa: E722
            # ignore error because connection may already be closed
            pass

    async def handle_session(self):
        await self.__websocket.send_json({"type": "session", "data": self._session_id})

        while True:
            message = await self.__websocket.receive_json()

            if message["type"] == "speech_start":
                await self._audio_send_loop()
                break
            elif message["type"] == "transcript":
                await self._handle_speech_transcript(message["data"])
            elif message["type"] == "settings":
                print(f"Got settings {message}")
        await asyncio.sleep(20)

    async def _handle_speech_transcript(self, data: str):
        (file_type, file_data) = data.split(";base64,")
        file_type = file_type.removeprefix("data:")

        response = await self._client.post(
            config.transcript_upload_url.format(session_id=self._session_id),
            files={"file": ("transcript", base64.b64decode(file_data), file_type)},
        )
        response.raise_for_status()

    async def _audio_send_loop(self) -> None:
        asr_url = config.asr_stream_url.format(session_id=self._session_id)
        try:
            async with websockets.connect(asr_url) as con:

                async def sender():
                    while True:
                        try:
                            asr_data = await con.recv()
                            json_data = json.loads(asr_data)
                            await self.__websocket.send_text(asr_data)  # type: ignore
                            if json_data["type"] == "complete":
                                return

                        except Exception as e:
                            raise WebSocketError("Error reading from downstream") from e

                sender_task = asyncio.create_task(sender())

                while True:
                    message = await self.__websocket.receive()
                    if "bytes" in message:
                        await con.send(message["bytes"])
                        continue

                    message = json.loads(message["text"])
                    if message["type"] != "speech_end":
                        raise RuntimeError(f"Unexpected message {message}")

                    logger.info("Received end from client")
                    await con.send("STOP")
                    break

                await sender_task

        except Exception as e:
            raise WebSocketError("Error reading from WebSocket ") from e

    async def queue_listener(self):
        async for msg in rabbitmq.read_queue(
            self._channel, f"session-{self._session_id}", None
        ):
            await self.__websocket.send_bytes(msg.body)

    async def send_message(self, message: typing.Any) -> None:
        """Sends a message to the WebSocket."""
        try:
            if isinstance(message, bytes):
                await self.__websocket.send_bytes(message)
            elif isinstance(message, str):
                await self.__websocket.send_text(message)
            else:
                await self.__websocket.send_text(json.dumps(message))
        except Exception as e:
            raise WebSocketError("Error writing to WebSocket ") from e
