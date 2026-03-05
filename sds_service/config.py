from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings
from shared.store import StoreConfig


class Settings(SharedBaseSettings):
    rabbitmq_url: str = Field()
    audio_recording_url: str = Field()
    whisper_model: str = "tiny"
    store: StoreConfig


config = Settings.load()
