from datetime import datetime
from typing import Literal

import pydantic


class StuckDetection(pydantic.BaseModel):
    stuck_id: str
    reason: Literal["silence", "repetition"]
    suggestions: list[str] | None
    at: datetime


class Timestamp(pydantic.BaseModel):
    start: datetime
    end: datetime
    duration: float


class Text(pydantic.BaseModel):
    type: Literal["text"]
    text: str
    timestamp: Timestamp


class Silence(pydantic.BaseModel):
    type: Literal["silence"]
    timestamp: Timestamp


class ASRData(pydantic.BaseModel):
    type: Literal["partial", "complete"]
    lines: list[Text | Silence]
    full_text: str
    session_id: str

    current_silence: Silence | None
    remaining_time: float
