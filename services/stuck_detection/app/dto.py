from datetime import datetime
from typing import Literal, Optional

import pydantic


class UnstuckDetection(pydantic.BaseModel): ...


class StuckDetection(pydantic.BaseModel):
    reason: Literal["silence", "repetition"]
    suggestion: str | None = None


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


class SessionType(pydantic.BaseModel):
    type: Literal["speech", "answer"]


class ASRData(pydantic.BaseModel):
    type: Literal["partial", "complete"]
    lines: list[Text | Silence]
    full_text: str
    session_id: str
    session_type: Optional[SessionType]

    current_silence: CurrentSilence | None


class MQData(pydantic.BaseModel):
    type: Literal["a_s_r"]
    data: ASRData
