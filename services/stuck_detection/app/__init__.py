from contextlib import asynccontextmanager

from shared import rabbitmq

from .config import config
from .detector import detector
from .dto import ASRData, UnstuckDetection

__all__ = ["app", "config"]

from fastapi import FastAPI


class ASRListener(rabbitmq.QueueListener[ASRData]):
    def __init__(self, rabbitmq_url: str):
        super().__init__(
            rabbitmq_url,
            None,
            ASRData,
            exchange="stress",
            response_exchange="results",
        )

    async def handle_message(self, message: ASRData) -> rabbitmq.Message | None:
        if message.session_type and message.session_type == "answer":
            return

        detection = await detector.detect_stuck(message)
        if detection is None:
            return

        print(detection)

        if isinstance(detection, UnstuckDetection):
            msg = {
                "type": "unstuck",
            }

        elif not detection.suggestion:
            msg = {
                "type": "stuck",
            }
        else:
            msg = {
                "type": "stuck_suggestion",
                "data": detection.suggestion,
            }

        return rabbitmq.Message(data=msg, routing_key=message.session_id)


@asynccontextmanager
async def lifespan(app: FastAPI):
    with ASRListener(config.rabbitmq_url):
        yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def main():
    return "Running"
