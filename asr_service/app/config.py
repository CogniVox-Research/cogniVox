from typing import Literal
from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings


class Settings(SharedBaseSettings):
    rabbitmq_url: str = Field()
    cors_allow_origins: list[str] = Field()

    whisper_model: Literal["tiny", "base", "small", "medium", "large"] = Field(
        default="medium"
    )
    warmup_model: bool = Field(default=True)


config = Settings.load()
