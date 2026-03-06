import os
import typing

from pydantic import Field, model_validator
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    TomlConfigSettingsSource,
)

__all__ = ["Settings", "config"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        toml_file="config.toml",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
    )

    port: int = Field()
    algorithm: str = Field(default="RS256")
    access_token_expire_minutes: int = Field(default=60)
    private_key_path: str = Field()
    public_key_path: str = Field()

    # Resolved PEM content — populated by model_validator
    private_key: str = Field(default="")
    public_key: str = Field(default="")

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        return (
            env_settings,
            dotenv_settings,
            file_secret_settings,
            TomlConfigSettingsSource(settings_cls),
            init_settings,
        )

    @model_validator(mode="after")
    def load_keys(self) -> typing.Self:
        # Resolve relative paths from the service root (one level above this file)
        service_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

        def _read(path: str) -> str:
            full = path if os.path.isabs(path) else os.path.join(service_root, path)
            with open(full, "r") as f:
                return f.read()

        self.private_key = _read(self.private_key_path)
        self.public_key = _read(self.public_key_path)
        return self


config = Settings()  # type: ignore[call-arg]
