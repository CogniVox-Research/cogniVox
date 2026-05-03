from contextlib import asynccontextmanager

from shared import rabbitmq

from .config import MQConfig, config
from .detector import detector
from .dto import ASRData, MQData, UnstuckDetection

__all__ = ["app", "config"]

from fastapi import FastAPI


class ASRListener(rabbitmq.QueueListener[MQData]):
    def __init__(self, config: MQConfig):
        super().__init__(
            config,
            None,
            MQData,
            exchange="asr",
            routing_key="#",
            response_exchange="results",
        )

    async def handle_message(self, message: MQData) -> rabbitmq.Message | None:
        asr = message.data

        if asr.session_type and asr.session_type.type == "answer":
            return

        detection = await detector.detect_stuck(asr)
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

        return rabbitmq.Message(data=msg, routing_key=asr.session_id)


@asynccontextmanager
async def lifespan(app: FastAPI):
    with ASRListener(config.rabbitmq):
        yield


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health():
    return "OK"
