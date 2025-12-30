from pydantic import Field
__all__ = ["Settings", "config"]

from shared import SharedBaseSettings


class Settings(SharedBaseSettings):
    rabbitmq_url: str = Field()

    # add other config keys here



config = Settings.load()