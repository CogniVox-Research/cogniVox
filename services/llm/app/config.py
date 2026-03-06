"""Configuration module for LLM Service"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"


settings = Settings()
