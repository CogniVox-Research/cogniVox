from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings


class Settings(SharedBaseSettings):
    port: int = Field()
    enable_thinking: bool = Field()
    rabbitmq_url: str = Field()


config = Settings.load()
