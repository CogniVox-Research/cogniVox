from .config import config

__all__ = ["app", "config"]

from fastapi import FastAPI

app = FastAPI()

print(config)