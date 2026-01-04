import joblib
import numpy as np
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# ---------------------------------------------------
# LOAD MODELS ONCE
# ---------------------------------------------------

clarity_model = joblib.load(os.path.join(MODEL_DIR, "clarity_model.joblib"))
pace_model = joblib.load(os.path.join(MODEL_DIR, "pace_model.joblib"))
pauses_model = joblib.load(os.path.join(MODEL_DIR, "pauses_model.joblib"))
pitch_model = joblib.load(os.path.join(MODEL_DIR, "pitch_model.joblib"))
loudness_model = joblib.load(os.path.join(MODEL_DIR, "loudness_model.joblib"))


# ---------------------------------------------------
# UTILS
# ---------------------------------------------------

def clamp(value, min_val=1.0, max_val=5.0):
    return max(min_val, min(max_val, float(value)))


def round_score(value):
    return int(round(value))


def predict(model, features, feature_names):
    df = pd.DataFrame([features], columns=feature_names)
    return model.predict(df)[0]


# ---------------------------------------------------
# SCORING FUNCTIONS
# ---------------------------------------------------

def score_clarity(metrics):
    raw = predict(
        clarity_model,
        [
            metrics["articulation_rate"],
            metrics["disfluencies"],
            metrics["filled_pauses"],
        ],
        ["articulation_rate", "disfluencies", "filled_pauses"]
    )
    return round_score(clamp(raw))


def score_pace(metrics):
    raw = predict(
        pace_model,
        [metrics["wpm"]],
        ["wpm"]
    )

    if metrics["wpm"] < 90 or metrics["wpm"] > 180:
        raw = min(raw, 2.0)

    return round_score(clamp(raw))


def score_pauses(metrics):
    raw = predict(
        pauses_model,
        [metrics["avg_pause"]],
        ["avg_pause"]
    )

    if metrics["avg_pause"] > 0.8:
        raw = min(raw, 2.0)
    elif metrics["avg_pause"] < 0.15:
        raw = min(raw, 3.0)

    return round_score(clamp(raw))


def score_pitch(metrics):
    raw = predict(
        pitch_model,
        [metrics["pitch_variability"]],
        ["pitch_variability"]
    )
    return round_score(clamp(raw))


def score_loudness(metrics):
    raw = predict(
        loudness_model,
        [metrics["loudness_variance"]],
        ["loudness_variance"]
    )
    return round_score(clamp(raw))


# ---------------------------------------------------
# FINAL SCORING ENTRY POINT
# ---------------------------------------------------

def score_speech(metrics):
    return {
        "clarity": score_clarity(metrics),
        "pace": score_pace(metrics),
        "pauses": score_pauses(metrics),
        "pitch": score_pitch(metrics),
        "loudness": score_loudness(metrics),
    }
