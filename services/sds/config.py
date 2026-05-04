from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings
from shared.store import StoreConfig


class Settings(SharedBaseSettings):
    whisper_model: str = "tiny"
    file_store: StoreConfig


config = Settings.load()
