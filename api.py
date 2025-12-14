import os
import shutil
import whisper
from fastapi import FastAPI, UploadFile, File, HTTPException

from features.extract_metrics import extract_metrics
from scoring.score_speech import score_speech
from feedback.generate_feedback import generate_feedback


# ---------------------------------------------------
# APP SETUP
# ---------------------------------------------------

app = FastAPI(
    title="Speech Delivery Scoring API",
    description="Analyze speech delivery quality and provide feedback",
    version="1.0.0"
)

UPLOAD_DIR = "audio/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load Whisper ONCE
whisper_model = whisper.load_model("tiny")


# ---------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------

@app.get("/")
def root():
    return {"status": "Speech Delivery Scoring API is running"}


# ---------------------------------------------------
# MAIN ENDPOINT
# ---------------------------------------------------

@app.post("/analyze-speech")
async def analyze_speech(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".wav", ".mp3", ".m4a")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

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

        return {
            "metrics": metrics,
            "scores": scores,
            "feedback": feedback
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Optional: delete file after processing
        if os.path.exists(file_path):
            os.remove(file_path)