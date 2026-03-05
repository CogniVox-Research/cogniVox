"""Configuration module for SDS Service"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    rabbitmq_url: str = "amqp://guest:guest@rabbitmq:5672/"
    audio_recording_url: str = ""
    whisper_model: str = "tiny"

    class Config:
        env_file = ".env"


settings = Settings()
