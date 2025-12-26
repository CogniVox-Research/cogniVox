import asyncio
from pathlib import Path
import typing
from fastapi import WebSocket, WebSocketDisconnect
from whisperlivekit import AudioProcessor, TranscriptionEngine
from whisperlivekit.audio_processor import FrontData

from .websocket import WebSocketError, websocket_reader, websocket_writer
from .config import config
from . import logger


def get_full_text(data: FrontData) -> str:
    lines = [line.text for line in data.lines if line.text and line.speaker]
    return "".join(lines)


class ASREngine:
    def __init__(self):
        self.engine: TranscriptionEngine | None = None

    def init(self):
        logger.info("Initializing ASR engine...")
        self.engine = TranscriptionEngine(
            model_size=config.whisper_model,
            warmup_file=Path(__file__).parent.parent / "micro-machines.wav",
        )
        logger.info("ASR engine initialized.")

    async def start_session(
        self,
        session_id: str,
        websocket: WebSocket,
        transcript_cb: typing.Callable[[FrontData], typing.Awaitable[None]]
        | None = None,
        complete_cb: typing.Callable[[str], typing.Awaitable[None]] | None = None,
    ) -> None:
        assert self.engine is not None, "Transcription engine is not initialized"

        await websocket.accept()
        ws_writer = websocket_writer(websocket)

        audio_processor = AudioProcessor(transcription_engine=self.engine)
        results_generator = await audio_processor.create_tasks()

        async def audio_stream_handler():
            try:
                async for audio_chunk in websocket_reader(websocket):
                    await audio_processor.process_audio(audio_chunk)
            finally:
                # signal end of stream
                await audio_processor.process_audio(None)

        asyncio.create_task(audio_stream_handler())

        try:
            last_response: FrontData | None = None
            async for response in results_generator:
                # send data to websocket to update ui
                try:
                    await ws_writer({"event": "partial", "content": response.to_dict()})
                except WebSocketError as e:
                    logger.error(f"WebSocket error: {e}")
                    # ignore the error and continue processing

                # send partial transcript update if the text has changed.
                if (
                    last_response
                    and transcript_cb
                    and get_full_text(response) != get_full_text(last_response)
                ):
                    logger.debug(f"Partial transcription sent: {response.to_dict()}")
                    await transcript_cb(response)

                last_response = response

            if last_response and complete_cb:
                full_text = get_full_text(last_response)
                await complete_cb(full_text)
                await ws_writer(
                    {"event": "completed", "content": last_response, "text": full_text}
                )

        except Exception as e:
            logger.error(
                f"Unexpected error in websocket_endpoint main loop: {e}", exc_info=True
            )
        finally:
            logger.info(f"Cleaning up ASR session {session_id}...")
            await websocket.close()
            await audio_processor.cleanup()
