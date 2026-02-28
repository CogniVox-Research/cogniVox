import os
import secrets
import traceback

import pydantic
import whisper
from fastapi import FastAPI, HTTPException
from shared.store import connect_store

from config import config
from features.extract_metrics import extract_metrics
from feedback.generate_feedback import generate_feedback
from scoring.score_speech import score_speech

# ---------------------------------------------------
# APP SETUP
# ---------------------------------------------------

app = FastAPI(
    title="Speech Delivery Scoring API",
    description="Analyze speech delivery quality and provide feedback",
    version="1.0.0",
)

UPLOAD_DIR = "audio/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load Whisper ONCE
whisper_model = whisper.load_model("tiny")

store = connect_store(config.store)

# ---------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------


@app.get("/")
def root():
    return {"status": "Speech Delivery Scoring API is running"}


# ---------------------------------------------------
# MAIN ENDPOINT
# ---------------------------------------------------


class SDSRequest(pydantic.BaseModel):
    audio_key: str
    transcript: str


@app.post("/analyze-speech")
async def analyze_speech(req: SDSRequest):
    data = store.get(req.audio_key)

    # Save uploaded file
    file_name = secrets.token_urlsafe() + ".wav"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    with open(file_path, "wb") as file:
        file.write(data)

    try:
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

        result = {"metrics": metrics, "scores": scores, "feedback": feedback}
        print(result)
        return result
    except Exception as e:
        print(f"SDS error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Optional: delete file after processing
        if os.path.exists(file_path):
            os.remove(file_path)
