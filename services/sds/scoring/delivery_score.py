"""
Compute a single speech delivery score (0–5) from the five sub-scores,
using scenario-specific weights derived from training data.

Scale
-----
  Sub-scores live on a 1–5 scale (from the scoring models).
  The delivery score is normalised to 0–5 so that:
    • All sub-scores = 1.0  →  delivery_score = 0.0  (worst possible)
    • All sub-scores = 5.0  →  delivery_score = 5.0  (best possible)

  Formula:
    weighted_sum   = Σ weight_i × score_i        (range 1–5)
    delivery_score = (weighted_sum − 1) / 4 × 5  (range 0–5)

Weights
-------
  Loaded at module import from models/delivery_weights.json.
  Derived by training a Random Forest on each scenario's synthetic
  dataset (quality label ~ 5 sub-ratings) and reading feature
  importances.  See training/derive_weights.py for full methodology.

  Summary of data-derived weights:
    One-on-One  : clarity 0.51, pace 0.32, pitch 0.08, loudness 0.05, pauses 0.03
    Boardroom   : pitch 0.49,   clarity 0.34, pace 0.12, pauses 0.03, loudness 0.02
    Mass Speech : loudness 0.44, pitch 0.25, pace 0.17, clarity 0.12, pauses 0.02
"""

import json
import os

# ---------------------------------------------------
# LOAD WEIGHTS ONCE AT IMPORT TIME
# ---------------------------------------------------

_WEIGHTS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "models", "delivery_weights.json"
)

with open(_WEIGHTS_PATH) as _f:
    _WEIGHTS: dict = json.load(_f)

METRICS = ["clarity", "pace", "pauses", "pitch", "loudness"]

# Score labels (0–5 scale)
_LABELS = [
    (4.0, "Excellent"),
    (3.0, "Good"),
    (2.0, "Needs Work"),
    (0.0, "Poor"),
]


# ---------------------------------------------------
# PUBLIC API
# ---------------------------------------------------

def get_weights(speech_type_value: str) -> dict:
    """
    Return the weight dict for a given speech type value.
    Falls back to boardroom ("2") if the key is not found.
    """
    return _WEIGHTS.get(str(speech_type_value), _WEIGHTS["2"])


def compute_delivery_score(scores: dict, speech_type=None) -> dict:
    """
    Compute a weighted speech delivery score (0–5).

    Args:
        scores:      dict with keys clarity/pace/pauses/pitch/loudness (1–5 each)
        speech_type: SpeechType enum or string value ("1", "2", "3")

    Returns:
        dict with:
            delivery_score        float 0–5 (2 decimal places)
            delivery_score_label  str   "Excellent" / "Good" / "Needs Work" / "Poor"
            weighted_breakdown    dict  each metric's weighted contribution to the score
            weights_used          dict  weight applied to each metric
    """
    speech_type_value = (
        speech_type.value if hasattr(speech_type, "value") else str(speech_type)
    ) if speech_type else "2"

    weights = get_weights(speech_type_value)

    # Weighted sum on the 1–5 scale
    weighted_sum = sum(
        weights[m] * scores[m]
        for m in METRICS
        if m in scores and m in weights
    )

    # Normalise to 0–5
    delivery_score = round((weighted_sum - 1.0) / 4.0 * 5.0, 2)
    delivery_score = max(0.0, min(5.0, delivery_score))

    # Human-readable label
    label = next(lbl for threshold, lbl in _LABELS if delivery_score >= threshold)

    # Per-metric weighted contribution (shows which metric drove the score)
    breakdown = {
        m: round(weights[m] * scores[m], 3)
        for m in METRICS
        if m in scores and m in weights
    }

    return {
        "delivery_score":       delivery_score,
        "delivery_score_label": label,
        "weighted_breakdown":   breakdown,
        "weights_used":         {m: round(weights[m], 4) for m in METRICS},
    }
