from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings
from shared.rabbitmq import Config as MQConfig
from shared.store import StoreConfig


class Settings(SharedBaseSettings):
    rabbitmq: MQConfig = Field()
    llm_continue_url: str = Field()
    max_silence: float = Field()

    checked_sentences: int = Field()
    sentence_similarity_threshold: float = Field()
    repeated_sentence_threshold: int = Field()
    store: StoreConfig


config = Settings.load()
