import whisper
from features.extract_metrics import extract_metrics


# ---------------------------------------------------
# CONFIG
# ---------------------------------------------------

GOOD_AUDIO = "audio/good-speech.wav"   # replace with your good speech file
BAD_AUDIO  = "audio/bad-speech.wav"    # replace with your bad speech file

WHISPER_MODEL_SIZE = "tiny"


# ---------------------------------------------------
# LOAD WHISPER ONCE (IMPORTANT)
# ---------------------------------------------------

print("Loading Whisper model...")
model = whisper.load_model(WHISPER_MODEL_SIZE)
print("Whisper loaded.\n")


# ---------------------------------------------------
# TEST FUNCTION
# ---------------------------------------------------

def test_audio(audio_path):
    print("=" * 60)
    print(f"Analyzing: {audio_path}")
    print("=" * 60)

    # Transcribe
    result = model.transcribe(audio_path, fp16=False)
    transcript = result.get("text", "")
    segments = result.get("segments", [])

    # Extract metrics
    metrics = extract_metrics(audio_path, transcript, segments)

    # Print metrics
    for key, value in metrics.items():
        print(f"{key:20s}: {value}")

    return metrics


# ---------------------------------------------------
# MAIN
# ---------------------------------------------------

if __name__ == "__main__":
    print("\n--- GOOD SPEECH ---")
    good_metrics = test_audio(GOOD_AUDIO)

    print("\n--- BAD SPEECH ---")
    bad_metrics = test_audio(BAD_AUDIO)

    print("\nSanity check complete.")
