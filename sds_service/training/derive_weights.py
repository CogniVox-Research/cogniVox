"""
Derive scenario-specific delivery score weights from the five sub-ratings.

Method
------
For each scenario dataset (1-on-1, Boardroom, Mass Speech):

  1. Map Quality_Label → numeric outcome
       Bad=1.5, Good=3.5, Excellent=4.75
       (Mid-points of plausible label ranges; avoids anchoring on extreme
        boundary values which would distort gradient-based methods.)

  2. Train a Random Forest regressor:
         quality_numeric ~ Clarity_Rating + Pace_Rating + Pauses_Rating
                         + Pitch_Rating + Loudness_Rating

  3. Read out the RF feature importances.
     Why RF importances?
       • They measure how much each sub-rating *reduces prediction error*
         for overall quality — a direct, data-driven proxy for "how much
         does this metric actually matter in this context?"
       • Always positive, always sum to 1.0 → directly usable as weights.
       • Non-parametric: no assumption of linearity between sub-ratings
         and quality.

  4. Validate with 5-fold cross-validated R² to confirm the model
     generalises (not just memorising the training data).

  5. Save to models/delivery_weights.json for use at inference time.

Reproducibility: np.random.seed and sklearn random_state both fixed to 42.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score

# ---------------------------------------------------
# PATHS
# ---------------------------------------------------

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR     = os.path.join(SCRIPT_DIR, "data")
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
MODEL_DIR    = os.path.join(PROJECT_ROOT, "models")

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# ---------------------------------------------------
# CONFIG
# ---------------------------------------------------

# Numeric mapping for Quality_Label
# Bad  → 1.5  (centre of the 1–2 bad-score band)
# Good → 3.5  (centre of the 3–4 acceptable band)
# Excellent → 4.75  (upper region of the 4–5 excellent band)
LABEL_MAP = {"Bad": 1.5, "Good": 3.5, "Excellent": 4.75}

DATASETS = {
    "1": "speech_1on1_dataset.csv",
    "2": "speech_boardroom_dataset.csv",
    "3": "speech_mass_dataset.csv",
}

RATING_COLS  = [
    "Clarity_Rating", "Pace_Rating", "Pauses_Rating",
    "Pitch_Rating",   "Loudness_Rating",
]
METRIC_NAMES = ["clarity", "pace", "pauses", "pitch", "loudness"]

SCENARIO_LABELS = {
    "1": "One-on-One Conversational",
    "2": "Boardroom Professional",
    "3": "Mass Speech / Public Speaking",
}


# ---------------------------------------------------
# MAIN
# ---------------------------------------------------

if __name__ == "__main__":

    weights_out = {}

    for speech_type, filename in DATASETS.items():
        path = os.path.join(DATA_DIR, filename)
        df   = pd.read_csv(path)
        df.columns = [c.strip() for c in df.columns]

        y = df["Quality_Label"].map(LABEL_MAP).values
        X = df[RATING_COLS].values

        # Train RF
        rf = RandomForestRegressor(
            n_estimators=300,
            max_depth=8,
            min_samples_leaf=3,
            random_state=RANDOM_STATE,
        )
        rf.fit(X, y)

        # 5-fold CV R² to validate generalisation
        cv_r2 = cross_val_score(rf, X, y, cv=5, scoring="r2")

        # Importances already sum to 1.0
        importances = rf.feature_importances_
        scenario_weights = {
            metric: round(float(imp), 4)
            for metric, imp in zip(METRIC_NAMES, importances)
        }
        weights_out[speech_type] = scenario_weights

        # Print report
        print(f"\n{'=' * 58}")
        print(f"  {SCENARIO_LABELS[speech_type]}")
        print(f"{'=' * 58}")
        print(f"  Cross-validated R² : {cv_r2.mean():.3f} ± {cv_r2.std():.3f}")
        print(f"\n  Data-derived weights (feature importances):")
        for metric, w in sorted(scenario_weights.items(), key=lambda x: -x[1]):
            bar = "█" * int(w * 45)
            print(f"    {metric:>10s}  {w:.4f}  {bar}")

    # Save
    out_path = os.path.join(MODEL_DIR, "delivery_weights.json")
    with open(out_path, "w") as f:
        json.dump(weights_out, f, indent=2)

    print(f"\n  Weights saved → {out_path}")

    # ---------------------------------------------------
    # SANITY CHECK: dominant metric per scenario
    # ---------------------------------------------------
    print(f"\n{'=' * 58}")
    print("  DOMINANCE SANITY CHECK")
    print(f"{'=' * 58}")
    expectations = {
        "1": "clarity",
        "2": "pitch",
        "3": ("pitch", "loudness"),
    }
    for st, exp in expectations.items():
        w    = weights_out[st]
        top  = max(w, key=w.get)
        top2 = sorted(w, key=w.get, reverse=True)[:2]

        if isinstance(exp, tuple):
            ok = set(top2) == set(exp)
            note = f"top-2: {top2}"
        else:
            ok = top == exp
            note = f"top: {top}"

        status = "✓" if ok else "✗ UNEXPECTED"
        print(f"  Scenario {st} — {note}  {status}")

    print("\nDone ✓")
