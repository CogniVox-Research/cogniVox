import asyncio
from pathlib import Path

import aiofiles
from .config import config
from . import logger


class AudioRecorder:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.audio_chunks: list[str] = []

    async def add_chunk(self, data: bytes) -> None:
        chunk_path = self.temp_path / f"chunk_{len(self.audio_chunks):06d}"

        self.audio_chunks.append(str(chunk_path))
        async with aiofiles.open(chunk_path, "wb") as f:
            await f.write(data)

    async def __aenter__(self):
        self.temp_dir = aiofiles.tempfile.TemporaryDirectory(
            f"asr_recordings_{self.session_id}"
        )

        self.temp_path = Path(await self.temp_dir.__aenter__())
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        try:
            await self.__save_recording()
        finally:
            await self.temp_dir.__aexit__(exc_type, exc_val, exc_tb)

    async def __save_recording(self) -> None:
        out_file = Path(config.recording_dir) / f"{self.session_id}.wav"
        out_file = out_file.absolute()

        if out_file.exists():
            logger.warning(f"Recording file {out_file} already exists. Overwriting...")
            out_file.unlink()

        process = await asyncio.subprocess.create_subprocess_exec(
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            "concat:" + "|".join(self.audio_chunks),
            out_file,
        )

        await process.wait()
