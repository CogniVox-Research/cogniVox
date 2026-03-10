from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings
from shared.store import StoreConfig


class Settings(SharedBaseSettings):
    rabbitmq_url: str = Field()

    max_silence: float = Field()

    checked_sentences: int = Field()
    sentence_similarity_threshold: float = Field()
    repeated_sentence_threshold: int = Field()
    store: StoreConfig


config = Settings.load()
