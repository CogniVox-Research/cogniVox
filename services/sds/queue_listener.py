import json
from pathlib import Path
import aio_pika
from aio_pika.abc import AbstractChannel
import aiofiles
import httpx
import pydantic
from shared.rabbitmq import read_queue

from config import config
from api import whisper_model, extract_metrics, score_speech, generate_feedback


class SpeechDone(pydantic.BaseModel):
    session_id: str


async def queue_listener(con: AbstractChannel, client: httpx.AsyncClient):
    try:
        async for message in read_queue(con, "speech_done", SpeechDone):
            url = config.audio_recording_url.format(session_id=message.session_id)
            response = await client.get(url)
            audio_bytes = await response.aread()
            try:
                feedback = await handle_audio(message.session_id, audio_bytes)
            except Exception as e:
                print(e)
                continue

            await con.default_exchange.publish(
                aio_pika.Message(
                    body=json.dumps({"type": "speech_score", "data": feedback}).encode()
                ),
                routing_key=f"session-{message.session_id}",
                mandatory=False,
            )
    except Exception as e:
        print(e)


async def handle_audio(session_id: str, audio_data: bytes):
    print(f"Processing {session_id}")
    async with aiofiles.tempfile.TemporaryDirectory("recordings") as out_dir:
        audio_file = Path(out_dir) / f"{session_id}.wav"
        audio_file.write_bytes(audio_data)
        file_path = str(audio_file)

        # 1️⃣ Transcribe
        result = whisper_model.transcribe(file_path, fp16=False)
        transcript = result.get("text", "")
        segments = result.get("segments", [])

        # 2️⃣ Extract metrics
        metrics = extract_metrics(file_path, transcript, segments)

        # 3️⃣ Score speech
        scores = score_speech(metrics)

        # 4️⃣ Generate feedback
        feedback = generate_feedback(scores)

        return {"scores": scores, "feedback": feedback}
