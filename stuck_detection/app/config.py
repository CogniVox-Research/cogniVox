from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings


class Settings(SharedBaseSettings):
    port: int = Field()
    rabbitmq_url: str = Field()

    max_silence: float = Field()

    checked_sentences: int = Field()
    sentence_similarity_threshold: float = Field()
    repeated_sentence_threshold: int = Field()


config = Settings.load()
