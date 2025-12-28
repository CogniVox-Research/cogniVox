import asyncio
from pathlib import Path
import typing
from fastapi import WebSocket
from whisperlivekit import AudioProcessor, TranscriptionEngine
from whisperlivekit.audio_processor import FrontData

from .websocket import AudioWebSocket
from .ffmpeg_manager import CustomFFmpegManager
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

        warmup_file = Path(__file__).parent.parent / "micro-machines.wav"
        if not config.warmup_model:
            warmup_file = None
        elif not warmup_file.exists():
            logger.warning(f"Warmup file {warmup_file} does not exist. Skipping.")
            warmup_file = None

        self.engine = TranscriptionEngine(
            model_size=config.whisper_model,
            warmup_file=warmup_file,
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

        async with AudioWebSocket(websocket) as ws:
            audio_processor = AudioProcessor(transcription_engine=self.engine)
            out_file = Path(config.recording_dir) / f"{session_id}.wav"
            out_file = out_file.absolute()

            if out_file.exists():
                logger.warning(
                    f"Recording file {out_file} already exists. Overwriting..."
                )
                out_file.unlink()

            CustomFFmpegManager.patch_audio_processor(audio_processor, out_file)

            results_generator = await audio_processor.create_tasks()

            async def audio_stream_handler():
                try:
                    async for audio_chunk in ws.receive_audio_chunk():
                        # send the audio chunk for asr
                        await audio_processor.process_audio(audio_chunk)
                finally:
                    # signal end of stream
                    await audio_processor.process_audio(None)

            asyncio.create_task(audio_stream_handler())

            async def test():
                while not audio_processor.is_stopping:
                    logger.info(
                        f"silence {audio_processor.current_silence} {audio_processor.state}",
                    )
                    await asyncio.sleep(1)

            asyncio.create_task(test())

            try:
                last_response: FrontData | None = None
                async for response in results_generator:
                    # send data to websocket to update ui
                    await ws.send_message(
                        {"event": "partial", "content": response.to_dict()},
                    )

                    # send partial transcript update if the text has changed.
                    if (
                        last_response
                        and transcript_cb
                        and get_full_text(response) != get_full_text(last_response)
                    ):
                        logger.debug(
                            f"Partial transcription sent: {response.to_dict()}"
                        )
                        await transcript_cb(response)

                    last_response = response

                if last_response and complete_cb:
                    full_text = get_full_text(last_response)
                    await complete_cb(full_text)
                    await ws.send_message(
                        {
                            "event": "completed",
                            "content": last_response.to_dict(),
                            "text": full_text,
                        },
                    )

            except Exception as e:
                logger.error(
                    f"Unexpected error in websocket_endpoint main loop: {e}",
                    exc_info=True,
                )
            finally:
                logger.info(f"Cleaning up ASR session {session_id}...")
                await audio_processor.cleanup()
