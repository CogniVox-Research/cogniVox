import asyncio
from pathlib import Path
from whisperlivekit import AudioProcessor, ffmpeg_manager


class CustomFFmpegManager(ffmpeg_manager.FFmpegManager):
    """
    A custom FFmpeg manager that applies a filter chain for audio denoising and audio recording.
    It runs a high-pass filter, low-pass filter, FFT-based denoising, and loudness normalization.
    The audio is also recorded to the specified output file.
    """

    def __init__(self, out_file: Path, sample_rate: int = 16000, channels: int = 1):
        super().__init__(sample_rate, channels)
        self.out_file = out_file

    async def start(self) -> bool:
        # Code copied and adapted from whisperlivekit.ffmpeg_manager.FFmpegManager.start

        async with self._state_lock:
            if self.state != ffmpeg_manager.FFmpegState.STOPPED:
                ffmpeg_manager.logger.warning(
                    f"FFmpeg already running in state: {self.state}"
                )
                return False
            self.state = ffmpeg_manager.FFmpegState.STARTING

        try:
            cmd = [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                "pipe:0",
                # apply the denoising filter chain
                "-af",
                "highpass=200,lowpass=3000,afftdn",
                "-acodec",
                "pcm_s16le",
                "-ac",
                str(self.channels),
                "-ar",
                str(self.sample_rate),
                # use tee muxer to write to both pipe and file
                "-f",
                "tee",
                "-map",
                "0:a",
                f"[f=s16le]pipe:1|{self.out_file}",
            ]

            self.process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            self._stderr_task = asyncio.create_task(self._drain_stderr())

            async with self._state_lock:
                self.state = ffmpeg_manager.FFmpegState.RUNNING

            ffmpeg_manager.logger.info("FFmpeg started.")
            return True

        except FileNotFoundError:
            ffmpeg_manager.logger.error(ffmpeg_manager.ERROR_INSTALL_INSTRUCTIONS)
            async with self._state_lock:
                self.state = ffmpeg_manager.FFmpegState.FAILED
            if self.on_error_callback:
                await self.on_error_callback("ffmpeg_not_found")  # type: ignore
            return False

        except Exception as e:
            ffmpeg_manager.logger.error(f"Error starting FFmpeg: {e}")
            async with self._state_lock:
                self.state = ffmpeg_manager.FFmpegState.FAILED
            if self.on_error_callback:
                await self.on_error_callback("start_failed")  # type: ignore
            return False

    async def read_data(self, size: int) -> bytes | None:
        data = await super().read_data(size)
        print(f"Read {len(data) if data else 0} bytes of denoised audio data")
        return data

    @staticmethod
    def patch_audio_processor(processor: AudioProcessor, recording_file: Path):
        """Patch the AudioProcessor to use the CustomFFmpegManager."""
        old = processor.ffmpeg_manager
        assert old is not None

        ffmpeg_manager = CustomFFmpegManager(
            recording_file, old.sample_rate, old.channels
        )
        ffmpeg_manager.on_error_callback = old.on_error_callback
        processor.ffmpeg_manager = ffmpeg_manager
