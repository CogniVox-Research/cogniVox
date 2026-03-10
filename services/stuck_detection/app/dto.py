from datetime import datetime
from typing import Literal, Optional

import pydantic


class UnstuckDetection(pydantic.BaseModel):
    stuck_id: str


class StuckDetection(pydantic.BaseModel):
    reason: Literal["silence", "repetition"]
    suggestions: list[str] | None = None


class Timestamp(pydantic.BaseModel):
    start: float
    end: float

    @property
    def duration(self):
        return self.end - self.start


class Text(pydantic.BaseModel):
    type: Literal["partial", "complete"]
    text: str
    timestamp: Timestamp


class Silence(pydantic.BaseModel):
    type: Literal["silence"]
    timestamp: Timestamp


class CurrentSilence(pydantic.BaseModel):
    timestamp: Timestamp


class ASRData(pydantic.BaseModel):
    type: Literal["partial", "complete"]
    lines: list[Text | Silence]
    full_text: str
    session_id: str
    session_type: Optional[Literal["speech", "answer"]]

    current_silence: CurrentSilence | None


class MQData(pydantic.BaseModel):
    type: Literal["a_s_r"]
    data: ASRData
