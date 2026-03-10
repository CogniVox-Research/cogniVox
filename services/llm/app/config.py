"""Configuration module for LLM Service"""

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    use_gemini: bool = True

    @model_validator(mode="after")
    def check_key(self) -> "Settings":
        if self.use_gemini and self.gemini_api_key is None:
            raise ValueError("gemini_api_key is not set")
        return self

    class Config:
        env_file = ".env"


settings = Settings()
