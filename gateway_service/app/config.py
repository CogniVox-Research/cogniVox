from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings


class Settings(SharedBaseSettings):
    port: int = Field()
    cors_allow_origins: list[str] = Field()

    asr_stream_url: str = Field()
    transcript_upload_url: str = Field()

    # add other config keys here


config = Settings.load()
