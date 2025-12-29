from datetime import datetime
import typing

import pydantic
from whisperlivekit import AudioProcessor
from whisperlivekit.audio_processor import (
    FrontData,
    Line as WhisperLine,
    Silence as WhisperSilence,
)


def get_full_text(data: FrontData) -> str:
    lines = [line.text for line in data.lines if line.text and line.speaker]
    return "".join(lines)


class Timestamp(pydantic.BaseModel):
    start: datetime
    end: datetime
    duration: float

    @classmethod
    def from_line(cls, initial: float, line: WhisperLine | WhisperSilence):
        assert line.start is not None
        start = datetime.fromtimestamp(initial + line.start)
        end = datetime.fromtimestamp(initial + line.end) if line.end else datetime.now()
        return cls(start=start, end=end, duration=(end - start).total_seconds())


class Text(pydantic.BaseModel):
    type: str = pydantic.Field(default="text")
    text: str
    timestamp: Timestamp


class Silence(pydantic.BaseModel):
    type: str = pydantic.Field(default="silence")
    timestamp: Timestamp


class ASRData(pydantic.BaseModel):
    type: typing.Literal["partial", "complete"]
    lines: list[Text | Silence]
    full_text: str

    current_silence: Silence | None
    remaining_time: float

    @classmethod
    def from_whisper_data(
        cls,
        processor: AudioProcessor,
        data: FrontData,
        start_time: float,
        is_complete: bool = False,
    ):
        model = cls(
            type="complete" if is_complete else "partial",
            lines=[],
            full_text=get_full_text(data),
            current_silence=None,
            remaining_time=data.remaining_time_transcription,
        )

        if processor.current_silence:
            model.current_silence = Silence(
                timestamp=Timestamp.from_line(start_time, processor.current_silence),
            )

        for item in data.lines:
            if item.is_silent():
                model.lines.append(
                    Silence(
                        timestamp=Timestamp.from_line(start_time, item),
                    )
                )
            else:
                assert item.text is not None
                model.lines.append(
                    Text(
                        text=item.text,
                        timestamp=Timestamp.from_line(start_time, item),
                    )
                )

        return model
