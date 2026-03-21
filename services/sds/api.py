import os
import secrets
import shutil
import traceback
from enum import Enum

import pydantic
import whisper
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from shared.store import connect_store

from config import config
from features.extract_metrics import extract_metrics
from feedback.generate_feedback import generate_feedback
from scoring.delivery_score import compute_delivery_score
from scoring.score_speech import score_speech

# ---------------------------------------------------
# ENUMS
# ---------------------------------------------------


class SpeechType(str, Enum):
    ONE_ON_ONE = "1"
    BOARDROOM = "2"
    MASS_SPEECH = "3"


class SDSRequest(pydantic.BaseModel):
    audio_key: str
    transcript: str
    speech_type: SpeechType


# ---------------------------------------------------
# APP SETUP
# ---------------------------------------------------

app = FastAPI(
    title="Speech Delivery Scoring API",
    description="Analyze speech delivery quality and provide feedback",
    version="1.0.0",
)
store = connect_store(config.store)

UPLOAD_DIR = "audio/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load Whisper model from config
whisper_model = whisper.load_model(config.whisper_model)


# ---------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------


@app.get("/")
def root():
    return {"status": "Speech Delivery Scoring API is running"}


@app.get("/health")
async def health():
    return "OK"


# ---------------------------------------------------
# MAIN ENDPOINT
# ---------------------------------------------------


@app.post("/analyze-speech")
async def analyze_speech(req: SDSRequest):
    print(f"Getting audio file {req.audio_key}")
    data = store.get(req.audio_key)

    # Save uploaded file
    file_name = secrets.token_urlsafe() + ".wav"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    with open(file_path, "wb") as file:
        file.write(data)

    speech_type = req.speech_type
    return await get_score_speech(file_path, speech_type)


@app.post("/test-analyze-speech")
async def test_analyze_speech(
    file: UploadFile = File(...), speech_type: SpeechType = Form(...)
):
    if not file.filename.lower().endswith((".wav", ".mp3", ".m4a")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return await get_score_speech(file_path, speech_type)


async def get_score_speech(file_path, speech_type):
    try:
        # 1️⃣ Transcribe
        result = whisper_model.transcribe(file_path, fp16=False)
        transcript = result.get("text", "")
        segments = result.get("segments", [])

        # 2️⃣ Extract metrics
        metrics = extract_metrics(file_path, transcript, segments)

        # 3️⃣ Score speech
        scores = score_speech(metrics, speech_type=speech_type)

        # 4️⃣ Compute overall delivery score
        delivery = compute_delivery_score(scores, speech_type=speech_type)

        # 5️⃣ Generate feedback (with AI-powered context summary)
        feedback = generate_feedback(
            scores, speech_type=speech_type, delivery_data=delivery
        )

        return {
            "speech_type": speech_type.name,
            "speech_type_number": speech_type.value,
            "metrics": metrics,
            "scores": scores,
            "delivery": delivery,
            "feedback": feedback,
        }

    except Exception as e:
        print(f"SDS error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Optional: delete file after processing
        if os.path.exists(file_path):
            os.remove(file_path)
