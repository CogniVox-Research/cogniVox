import joblib
import numpy as np
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# ---------------------------------------------------
# LOAD MODELS ONCE
# ---------------------------------------------------

def _load_model(*filenames):
    for filename in filenames:
        file_path = os.path.join(MODEL_DIR, filename)
        if os.path.exists(file_path):
            return joblib.load(file_path)
    raise FileNotFoundError(f"None of the model files were found: {filenames}")


MODEL_SETS = {
    "1": {
        "clarity":  _load_model("clarity_model_1on1.joblib"),
        "pace":     _load_model("pace_model_1on1.joblib"),
        "pauses":   _load_model("pauses_model_1on1.joblib"),
        "pitch":    _load_model("pitch_model_1on1.joblib"),
        "loudness": _load_model("loudness_model_1on1.joblib"),
    },
    "2": {
        "clarity":  _load_model("clarity_model_boardroom.joblib"),
        "pace":     _load_model("pace_model_boardroom.joblib"),
        "pauses":   _load_model("pauses_model_boardroom.joblib"),
        "pitch":    _load_model("pitch_model_boardroom.joblib"),
        "loudness": _load_model("loudness_model_boardroom.joblib"),
    },
    "3": {
        "clarity":  _load_model("clarity_model_mass.joblib"),
        "pace":     _load_model("pace_model_mass.joblib"),
        "pauses":   _load_model("pauses_model_mass.joblib"),
        "pitch":    _load_model("pitch_model_mass.joblib"),
        "loudness": _load_model("loudness_model_mass.joblib"),
    },
}


# ---------------------------------------------------
# CROSS-METRIC RULES
# ---------------------------------------------------

# Conversational contexts tolerate less extreme pace than larger audiences.
# Values represent the preferred WPM range before clarity is penalized.
PACE_CLARITY_WPM_BANDS = {
    "1": (110, 160),  # One-on-One
    "2": (105, 155),  # Boardroom
    "3": (95, 170),   # Mass Speech
}


def _apply_pace_clarity_penalty(clarity_score, pace_score, metrics, speech_type_value):
    """
    Reduce clarity when speaking pace is contextually unnatural.

    Why:
        Fast/slow delivery can reduce intelligibility in practice even when
        articulation/disfluency features look good in isolation.

    Strategy:
        1) Add a penalty based on how far WPM is from context band.
        2) Add a penalty when pace model already rates pace as weak.
        3) Apply safety caps so clarity cannot stay very high under severe pace mismatch.
    """
    wpm = float(metrics.get("wpm", 0.0))
    low, high = PACE_CLARITY_WPM_BANDS.get(str(speech_type_value), PACE_CLARITY_WPM_BANDS["2"])

    if low <= wpm <= high:
        return clarity_score

    distance = (low - wpm) if wpm < low else (wpm - high)

    penalty = 0.0

    # WPM distance penalty
    if distance > 30:
        penalty += 0.8
    elif distance > 20:
        penalty += 0.6
    elif distance > 10:
        penalty += 0.4
    else:
        penalty += 0.2

    # Pace-score severity penalty
    if pace_score <= 2.0:
        penalty += 0.4
    elif pace_score <= 2.5:
        penalty += 0.2

    adjusted_clarity = clarity_score - penalty

    # Hard caps for severe pace mismatch
    if distance > 30:
        adjusted_clarity = min(adjusted_clarity, 2.8)
    elif distance > 20 or pace_score <= 2.0:
        adjusted_clarity = min(adjusted_clarity, 3.2)

    return clamp_and_round(adjusted_clarity)


# ---------------------------------------------------
# UTILS
# ---------------------------------------------------

def clamp_and_round(value, min_val=1.0, max_val=5.0, step=0.1):
    value = float(value)
    value = max(min_val, min(max_val, value))
    return np.round(value / step) * step


def predict(model, features, feature_names):
    df = pd.DataFrame([features], columns=feature_names)
    return model.predict(df)[0]


# ---------------------------------------------------
# SCORING FUNCTIONS
# ---------------------------------------------------

def score_clarity(metrics, model):
    raw = predict(
        model,
        [
            metrics["articulation_rate"],
            metrics["disfluencies"],
            metrics["filled_pauses"],
        ],
        ["articulation_rate", "disfluencies", "filled_pauses"]
    )
    return clamp_and_round(raw)


def score_pace(metrics, model):
    raw = predict(
        model,
        [metrics["wpm"]],
        ["wpm"]
    )

    if metrics["wpm"] < 90 or metrics["wpm"] > 180:
        raw = min(raw, 2.0)

    return clamp_and_round(raw)


def score_pauses(metrics, model):
    raw = predict(
        model,
        [metrics["avg_pause"]],
        ["avg_pause"]
    )

    if metrics["avg_pause"] > 0.8:
        raw = min(raw, 2.0)
    elif metrics["avg_pause"] < 0.15:
        raw = min(raw, 3.0)

    return clamp_and_round(raw)


def score_pitch(metrics, model):
    raw = predict(
        model,
        [metrics["pitch_variability"]],
        ["pitch_variability"]
    )
    return clamp_and_round(raw)


def score_loudness(metrics, model):
    raw = predict(
        model,
        [metrics["loudness_variance"]],
        ["loudness_variance"]
    )
    return clamp_and_round(raw)


# ---------------------------------------------------
# FINAL SCORING ENTRY POINT
# ---------------------------------------------------

def score_speech(metrics, speech_type=None):
    """
    Score speech metrics with the model set selected by speech type.
    
    Args:
        metrics: Dictionary of extracted metrics
        speech_type: SpeechType enum (1=One-on-One, 2=Boardroom, 3=Mass Speech)
    """
    speech_type_value = speech_type.value if hasattr(speech_type, "value") else str(speech_type or "2")
    model_set = MODEL_SETS.get(speech_type_value, MODEL_SETS["2"])

    clarity_score = score_clarity(metrics, model_set["clarity"])
    pace_score = score_pace(metrics, model_set["pace"])
    clarity_score = _apply_pace_clarity_penalty(
        clarity_score,
        pace_score,
        metrics,
        speech_type_value,
    )

    scores = {
        "clarity": clarity_score,
        "pace": pace_score,
        "pauses": score_pauses(metrics, model_set["pauses"]),
        "pitch": score_pitch(metrics, model_set["pitch"]),
        "loudness": score_loudness(metrics, model_set["loudness"]),
    }

    return scores
