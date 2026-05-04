from pydantic import Field

__all__ = ["Settings", "config"]

from shared import SharedBaseSettings


class Settings(SharedBaseSettings): ...


config: Settings = Settings.load()
