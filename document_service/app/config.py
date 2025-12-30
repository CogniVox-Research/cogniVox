from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings


class Settings(SharedBaseSettings):
    port: int = Field()
    upload_dir: str = Field()

    # add other config keys here


config = Settings.load()
