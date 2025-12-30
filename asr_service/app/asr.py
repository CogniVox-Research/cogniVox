import asyncio
from pathlib import Path
import time
import typing
from fastapi import WebSocket
from whisperlivekit import AudioProcessor, TranscriptionEngine
from whisperlivekit.audio_processor import FrontData

from .websocket import AudioWebSocket
from .ffmpeg_manager import CustomFFmpegManager
from .config import config
from . import logger, dto


ASRCallback = typing.Callable[[dto.ASRData], typing.Awaitable[None]]


class ASREngine:
    def __init__(self):
        self.engine: TranscriptionEngine | None = None

    def init(self):
        logger.info("Initializing ASR engine...")

        # load warmup file for asr model
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
        transcript_cb: ASRCallback | None = None,
    ) -> None:
        assert self.engine is not None, "Transcription engine is not initialized"

        async with AudioWebSocket(websocket) as ws:
            session = ASRSession(
                engine=self.engine,
                session_id=session_id,
                websocket=ws,
                transcript_cb=transcript_cb,
            )
            await session.run()


class ASRSession:
    def __init__(
        self,
        engine: TranscriptionEngine,
        session_id: str,
        websocket: AudioWebSocket,
        transcript_cb: ASRCallback | None = None,
    ) -> None:
        self.engine = engine
        self.session_id = session_id
        self.websocket = websocket
        self.transcript_cb = transcript_cb
        self.response: FrontData | None = None
        self.start_time = time.time()

        # create recording dir and remove recording if it already exists
        out_file = (Path(config.recording_dir) / f"{session_id}.wav").absolute()
        out_file.parent.mkdir(parents=True, exist_ok=True)
        if out_file.exists():
            logger.warning(f"Overwriting existing recording {out_file}")
            out_file.unlink()

        self.audio_processor = AudioProcessor(transcription_engine=self.engine)
        CustomFFmpegManager.patch_audio_processor(self.audio_processor, out_file)

    async def run(self) -> None:
        results_generator = await self.audio_processor.create_tasks()
        asyncio.create_task(self.audio_stream_handler())
        broadcast_task = asyncio.create_task(self.transcript_broadcaster())

        try:
            async for response in results_generator:
                self.response = response

            await broadcast_task
            await self.transcript_complete_handler()

        except Exception as e:
            logger.error(
                f"Unexpected error in asr handler main loop: {e}",
                exc_info=True,
            )
        finally:
            logger.info(f"Cleaning up ASR session {self.session_id}...")
            await self.audio_processor.cleanup()

    async def transcript_broadcaster(self):
        """
        Sends an transcript update every second to the ui and the callback function
        """
        prev_response = None
        last_text = ""
        while not self.audio_processor.is_stopping:
            if self.response and self.response is not prev_response:
                data = dto.ASRData.from_whisper_data(
                    self.session_id,
                    self.audio_processor,
                    self.response,
                    start_time=self.start_time,
                )

                # send partial transcript update if the text has changed.
                if data.full_text != last_text and self.transcript_cb:
                    logger.debug(f"Partial transcription sent: {data.model_dump()}")
                    await self.transcript_cb(data)

                # send data to websocket to update ui
                await self.websocket.send_message(data.model_dump_json())
                last_text = data.full_text

            prev_response = self.response
            await asyncio.sleep(1)

    async def transcript_complete_handler(self):
        if not self.response:
            return

        data = dto.ASRData.from_whisper_data(
            self.session_id,
            self.audio_processor,
            self.response,
            start_time=self.start_time,
            is_complete=True,
        )

        if self.transcript_cb:
            await self.transcript_cb(data)

        await self.websocket.send_message(data.model_dump_json())

    async def audio_stream_handler(self):
        """
        Gets audio chunks from the websocket and sends it to the ASR model.
        """
        try:
            async for audio_chunk in self.websocket.receive_audio_chunk():
                # send the audio chunk for asr
                await self.audio_processor.process_audio(audio_chunk)
        finally:
            # signal end of stream
            await self.audio_processor.process_audio(None)
