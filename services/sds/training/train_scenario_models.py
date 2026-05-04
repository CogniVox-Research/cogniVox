"""
Generate scenario-specific synthetic datasets and train speech scoring models.

Scenarios
---------
  1 = One-on-One   (Clarity & Pace focused)
  2 = Boardroom    (Tone stability & Controlled Pace, heavy filler penalty)
  3 = Mass Speech  (Variation & Energy)

Weight Justification (derived from communication goals)
-------------------------------------------------------
  1-on-1:
    The listener is at arm's length.  Being *understood* is the primary goal,
    so Clarity dominates (0.35).  Comfortable conversational Pace matters
    next (0.25).  Projection is nearly irrelevant (Loudness 0.10).

  Boardroom:
    Authority and composure define success.  A steady, confident Tone (Pitch
    0.30) conveys competence.  Filler words actively undermine credibility →
    heavy filled-pause penalty.  Controlled Pace (0.20) and Clarity (0.20)
    support the message.  Loudness is moderate (0.15).

  Mass Speech:
    The speaker must *hold attention* across a large space.  Dynamic vocal
    Variation (Pitch 0.30) and strong Energy / projection (Loudness 0.30)
    dominate.  Pace (0.15) and Clarity (0.15) still matter but are secondary.

Statistical notes
-----------------
  • Features are drawn from scenario-tuned Gaussian / Poisson distributions
    whose parameters sit inside realistic ranges observed in the original
    speech_mvp_dataset.csv.
  • Sub-ratings are computed deterministically from features via scenario-
    specific ideal-range scoring functions, then rounded with controlled
    Gaussian noise (σ = 0.30-0.40) to emulate human rater variance.
  • Quality_Label is the weighted aggregate (Excellent ≥ 4.0, Good ≥ 2.8,
    Bad < 2.8).
  • Reproducibility: np.random.seed(42) and sklearn random_state=42.
"""

import numpy as np
import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

# ---------------------------------------------------
# CONFIG
# ---------------------------------------------------

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)
N_SAMPLES = 150                                     # per dataset

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR    = os.path.join(SCRIPT_DIR, "data")
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
MODEL_DIR   = os.path.join(PROJECT_ROOT, "models")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)


# ===================================================
# UTILITY FUNCTIONS
# ===================================================

def rate_from_ideal_range(values, ideal_min, ideal_max, sensitivity=1.0):
    """
    Map feature values → continuous 1-5 rating.

    Values inside [ideal_min, ideal_max] score ~4.3-5.0.
    Values outside are penalized proportional to normalised distance,
    scaled by *sensitivity*.
    """
    ratings = np.full_like(values, 4.5, dtype=float)
    rng = ideal_max - ideal_min

    below = values < ideal_min
    if np.any(below):
        dist = (ideal_min - values[below]) / (rng + 1e-8)
        ratings[below] = 4.5 - dist * 3.5 * sensitivity

    above = values > ideal_max
    if np.any(above):
        dist = (values[above] - ideal_max) / (rng + 1e-8)
        ratings[above] = 4.5 - dist * 3.5 * sensitivity

    return np.clip(ratings, 1.0, 5.0)


def rate_positive_correlation(values, low_val, high_val):
    """Linear map: higher value → higher rating."""
    return np.clip(np.interp(values, [low_val, high_val], [1.0, 5.0]), 1.0, 5.0)


def add_noise_and_round(ratings, noise_std=0.35):
    """Add Gaussian noise, round to integer, clamp 1-5."""
    noisy = ratings + np.random.normal(0, noise_std, len(ratings))
    return np.clip(np.round(noisy), 1, 5).astype(int)


def quality_label(weighted_avg):
    if weighted_avg >= 4.0:
        return "Excellent"
    elif weighted_avg >= 2.8:
        return "Good"
    else:
        return "Bad"


# ===================================================
# DATASET GENERATION
# ===================================================

# Quality-label weights per scenario (derived from communication goals)
QUALITY_WEIGHTS = {
    "1on1": {
        "clarity": 0.35, "pace": 0.25, "pauses": 0.15,
        "pitch":  0.15, "loudness": 0.10,
    },
    "boardroom": {
        "clarity": 0.20, "pace": 0.20, "pauses": 0.15,
        "pitch":  0.30, "loudness": 0.15,
    },
    "mass": {
        "clarity": 0.15, "pace": 0.15, "pauses": 0.10,
        "pitch":  0.30, "loudness": 0.30,
    },
}


def generate_dataset(scenario):
    """Return (DataFrame, weights_dict) for a given scenario key."""
    n = N_SAMPLES

    # ------------------------------------------------------------------
    # 1. FEATURE DISTRIBUTIONS  (tuned per scenario)
    # ------------------------------------------------------------------
    if scenario == "1on1":
        wpm         = np.random.normal(132, 20, n)
        avg_pause   = np.random.normal(0.24, 0.12, n)
        pitch_var   = np.random.normal(45, 18, n)
        disfluencies   = np.random.poisson(1.5, n)
        filled_pauses  = np.random.poisson(2.0, n)
        loudness_var   = np.random.normal(0.006, 0.003, n)
        artic_rate     = np.random.normal(2.35, 0.40, n)

    elif scenario == "boardroom":
        wpm         = np.random.normal(142, 16, n)
        avg_pause   = np.random.normal(0.30, 0.10, n)
        pitch_var   = np.random.normal(48, 20, n)
        disfluencies   = np.random.poisson(1.0, n)
        filled_pauses  = np.random.poisson(1.5, n)
        loudness_var   = np.random.normal(0.006, 0.002, n)
        artic_rate     = np.random.normal(2.45, 0.35, n)

    elif scenario == "mass":
        wpm         = np.random.normal(150, 22, n)
        avg_pause   = np.random.normal(0.28, 0.12, n)
        pitch_var   = np.random.normal(55, 24, n)
        disfluencies   = np.random.poisson(1.0, n)
        filled_pauses  = np.random.poisson(1.5, n)
        loudness_var   = np.random.normal(0.007, 0.003, n)
        artic_rate     = np.random.normal(2.50, 0.40, n)

    # Clamp to realistic ranges
    wpm         = np.clip(wpm, 80, 200)
    avg_pause   = np.clip(avg_pause, 0.0, 0.80)
    pitch_var   = np.clip(pitch_var, 2.0, 100.0)
    disfluencies   = np.clip(disfluencies, 0, 10).astype(int)
    filled_pauses  = np.clip(filled_pauses, 0, 12).astype(int)
    loudness_var   = np.clip(loudness_var, 0.001, 0.018)
    artic_rate     = np.clip(artic_rate, 0.8, 3.5)

    # ------------------------------------------------------------------
    # 2. COMPUTE SUB-RATINGS  (scenario-specific scoring curves)
    # ------------------------------------------------------------------

    # --- Clarity (articulation_rate ↑, disfluencies ↓, filled_pauses ↓) ---
    clarity_base = rate_positive_correlation(artic_rate, 1.0, 3.2)
    if scenario == "1on1":
        # 1-on-1: clarity is paramount → strong penalties
        disf_pen = disfluencies * 0.40
        fp_pen   = filled_pauses * 0.35
    elif scenario == "boardroom":
        # Boardroom: filler words devastating to credibility
        disf_pen = disfluencies * 0.45
        fp_pen   = filled_pauses * 0.55
    else:   # mass
        disf_pen = disfluencies * 0.30
        fp_pen   = filled_pauses * 0.25
    clarity_raw = np.clip(clarity_base - disf_pen - fp_pen, 1.0, 5.0)
    clarity_rating = add_noise_and_round(clarity_raw, 0.30)

    # --- Pace (WPM inside an ideal conversational window) ---
    if scenario == "1on1":
        pace_raw = rate_from_ideal_range(wpm, 115, 155, sensitivity=1.2)
    elif scenario == "boardroom":
        pace_raw = rate_from_ideal_range(wpm, 125, 165, sensitivity=1.0)
    else:
        pace_raw = rate_from_ideal_range(wpm, 130, 175, sensitivity=0.9)
    pace_rating = add_noise_and_round(pace_raw, 0.35)

    # --- Pauses (avg_pause inside an ideal window) ---
    if scenario == "1on1":
        pauses_raw = rate_from_ideal_range(avg_pause, 0.15, 0.40, sensitivity=1.0)
    elif scenario == "boardroom":
        pauses_raw = rate_from_ideal_range(avg_pause, 0.22, 0.45, sensitivity=1.1)
    else:
        pauses_raw = rate_from_ideal_range(avg_pause, 0.18, 0.45, sensitivity=0.9)
    pauses_rating = add_noise_and_round(pauses_raw, 0.35)

    # --- Pitch (scenario determines ideal variability) ---
    if scenario == "1on1":
        # Natural, moderate variation
        pitch_raw = rate_from_ideal_range(pitch_var, 30, 65, sensitivity=1.0)
    elif scenario == "boardroom":
        # Steady, confident tone (tight band, high sensitivity)
        pitch_raw = rate_from_ideal_range(pitch_var, 35, 60, sensitivity=1.3)
    else:
        # High variation strongly rewarded (wide band, shifted up)
        pitch_raw = rate_from_ideal_range(pitch_var, 45, 95, sensitivity=1.2)
    pitch_rating = add_noise_and_round(pitch_raw, 0.30)

    # --- Loudness ---
    if scenario == "1on1":
        # Barely matters – wide forgiving range
        loudness_raw = rate_from_ideal_range(loudness_var, 0.002, 0.014,
                                             sensitivity=0.5)
    elif scenario == "boardroom":
        loudness_raw = rate_from_ideal_range(loudness_var, 0.003, 0.010,
                                             sensitivity=0.8)
    else:
        # Mass: projection is critical – more = better
        loudness_raw = rate_positive_correlation(loudness_var, 0.001, 0.012)
    loudness_rating = add_noise_and_round(loudness_raw, 0.35)

    # ------------------------------------------------------------------
    # 3. QUALITY LABEL  (weighted aggregate of sub-ratings)
    # ------------------------------------------------------------------
    w = QUALITY_WEIGHTS[scenario]
    weighted_avg = (
        w["clarity"]  * clarity_rating +
        w["pace"]     * pace_rating +
        w["pauses"]   * pauses_rating +
        w["pitch"]    * pitch_rating +
        w["loudness"] * loudness_rating
    )
    labels = [quality_label(v) for v in weighted_avg]

    # ------------------------------------------------------------------
    # 4. BUILD DATAFRAME  (matches speech_mvp_dataset.csv format)
    # ------------------------------------------------------------------
    df = pd.DataFrame({
        "Quality_Label":      labels,
        "Clarity_Rating":     clarity_rating,
        "Pace_Rating":        pace_rating,
        "Pauses_Rating":      pauses_rating,
        "Pitch_Rating":       pitch_rating,
        "Loudness_Rating":    loudness_rating,
        "WPM":                np.round(wpm, 6),
        "Avg_Pause":          np.round(avg_pause, 9),
        "Pitch_Variability":  np.round(pitch_var, 8),
        "Disfluencies":       disfluencies,
        "Filled_Pauses":      filled_pauses,
        "Loudness_Variance":  np.round(loudness_var, 9),
        "Articulation_Rate":  np.round(artic_rate, 9),
    })

    return df, w


# ===================================================
# MODEL TRAINING
# ===================================================

MODEL_CONFIGS = {
    "clarity": {
        "features": ["articulation_rate", "disfluencies", "filled_pauses"],
        "target":   "clarity_rating",
    },
    "pace": {
        "features": ["wpm"],
        "target":   "pace_rating",
    },
    "pauses": {
        "features": ["avg_pause"],
        "target":   "pauses_rating",
    },
    "pitch": {
        "features": ["pitch_variability"],
        "target":   "pitch_rating",
    },
    "loudness": {
        "features": ["loudness_variance"],
        "target":   "loudness_rating",
    },
}


def train_models_for_scenario(df, suffix):
    """Train all 5 sub-models for one scenario.  Returns results dict."""
    df_lc = df.copy()
    df_lc.columns = [c.strip().lower() for c in df_lc.columns]

    results = {}
    for name, cfg in MODEL_CONFIGS.items():
        X = df_lc[cfg["features"]]
        y = df_lc[cfg["target"]]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=RANDOM_STATE
        )

        model = RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            min_samples_leaf=3,
            random_state=RANDOM_STATE,
        )
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        mse   = mean_squared_error(y_test, preds)
        r2    = r2_score(y_test, preds)

        importances = dict(zip(cfg["features"], model.feature_importances_))

        fname = f"{name}_model_{suffix}.joblib"
        path  = os.path.join(MODEL_DIR, fname)
        joblib.dump(model, path)

        results[name] = {
            "mse": mse, "r2": r2,
            "importances": importances,
            "path": path,
        }
    return results


# ===================================================
# MAIN
# ===================================================

if __name__ == "__main__":

    SCENARIOS = {
        "1on1":      "One-on-One Conversational",
        "boardroom": "Boardroom Professional",
        "mass":      "Mass Speech / Public Speaking",
    }

    all_results = {}

    for key, label in SCENARIOS.items():
        print(f"\n{'=' * 65}")
        print(f"  SCENARIO: {label}")
        print(f"{'=' * 65}")

        # --- generate & save dataset ----------------------------------
        df, weights = generate_dataset(key)
        csv_path = os.path.join(DATA_DIR, f"speech_{key}_dataset.csv")
        df.to_csv(csv_path, index=False)

        print(f"\n  Dataset saved  → {csv_path}")
        print(f"  Rows           : {len(df)}")
        dist = df["Quality_Label"].value_counts().to_dict()
        print(f"  Quality dist.  : {dist}")

        # --- first 10 rows -------------------------------------------
        print(f"\n  First 10 rows:")
        print(df.head(10).to_string(index=False))

        # --- quality weights ------------------------------------------
        print(f"\n  Quality weights (communication-goal derived):")
        for k, v in weights.items():
            print(f"    {k:>10s} : {v:.2f}")

        # --- correlation matrix (ratings vs features) -----------------
        rating_cols  = ["Clarity_Rating", "Pace_Rating", "Pauses_Rating",
                        "Pitch_Rating", "Loudness_Rating"]
        feature_cols = ["WPM", "Avg_Pause", "Pitch_Variability",
                        "Disfluencies", "Filled_Pauses",
                        "Loudness_Variance", "Articulation_Rate"]

        corr = df[rating_cols + feature_cols].corr()
        print(f"\n  Correlation matrix (ratings ↔ features):")
        print(corr.loc[rating_cols, feature_cols].round(3).to_string())

        # --- train models --------------------------------------------
        print(f"\n  Training models …")
        results = train_models_for_scenario(df, key)
        all_results[key] = results

        for mname, r in results.items():
            print(f"\n    {mname.upper()}")
            print(f"      MSE  : {r['mse']:.3f}")
            print(f"      R²   : {r['r2']:.3f}")
            print(f"      Feature importances:")
            for feat, imp in r["importances"].items():
                print(f"        {feat:>20s} : {imp:.4f}")
            print(f"      Saved → {os.path.basename(r['path'])}")

    # ==================================================================
    # DOMINANCE VALIDATION
    # ==================================================================
    print(f"\n\n{'=' * 65}")
    print("  DOMINANCE VALIDATION")
    print(f"{'=' * 65}")

    # 1-on-1 → Clarity should dominate
    w1 = QUALITY_WEIGHTS["1on1"]
    top1 = max(w1, key=w1.get)
    c1_r2 = all_results["1on1"]["clarity"]["r2"]
    print(f"\n  1-on-1:")
    print(f"    Highest quality weight : {top1} ({w1[top1]:.2f})  "
          f"{'✓' if top1 == 'clarity' else '✗'}")
    print(f"    Clarity model R²       : {c1_r2:.3f}")
    print(f"    Clarity feat importance : "
          f"{all_results['1on1']['clarity']['importances']}")

    # Boardroom → Tone (pitch) should dominate
    wb = QUALITY_WEIGHTS["boardroom"]
    topb = max(wb, key=wb.get)
    pb_r2 = all_results["boardroom"]["pitch"]["r2"]
    print(f"\n  Boardroom:")
    print(f"    Highest quality weight : {topb} ({wb[topb]:.2f})  "
          f"{'✓' if topb == 'pitch' else '✗'}")
    print(f"    Pitch model R²         : {pb_r2:.3f}")

    # Mass → Variation (pitch) + Energy (loudness)
    wm = QUALITY_WEIGHTS["mass"]
    topm = sorted(wm, key=wm.get, reverse=True)[:2]
    pm_r2 = all_results["mass"]["pitch"]["r2"]
    lm_r2 = all_results["mass"]["loudness"]["r2"]
    print(f"\n  Mass Speech:")
    print(f"    Top 2 quality weights  : "
          f"{topm[0]} ({wm[topm[0]]:.2f}), {topm[1]} ({wm[topm[1]]:.2f})  "
          f"{'✓' if set(topm) == {'pitch', 'loudness'} else '✗'}")
    print(f"    Pitch model R²         : {pm_r2:.3f}")
    print(f"    Loudness model R²      : {lm_r2:.3f}")

    print(f"\n  All 15 models saved to : {MODEL_DIR}")
    print(f"  All 3 datasets saved to: {DATA_DIR}")
    print("\n  Done ✓")
