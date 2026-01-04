from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings


class Settings(SharedBaseSettings):
    rabbitmq_url: str = Field()
    audio_recording_url: str = Field()


config = Settings.load()
