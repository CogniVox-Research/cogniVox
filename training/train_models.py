import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import os

# ---------------------------------------------------
# CONFIG
# ---------------------------------------------------

DATA_PATH = "data/speech_mvp_dataset.csv"
MODEL_DIR = "models"

os.makedirs(MODEL_DIR, exist_ok=True)

RANDOM_STATE = 42

# ---------------------------------------------------
# LOAD DATA
# ---------------------------------------------------

df = pd.read_csv(DATA_PATH)

# Normalize column names (important)
df.columns = [c.strip().lower() for c in df.columns]

# ---------------------------------------------------
# FEATURE MAP PER MODEL
# ---------------------------------------------------

MODELS = {
    "clarity": {
        "features": ["articulation_rate", "disfluencies", "filled_pauses"],
        "target": "clarity_rating"
    },
    "pace": {
        "features": ["wpm"],
        "target": "pace_rating"
    },
    "pauses": {
        "features": ["avg_pause"],
        "target": "pauses_rating"
    },
    "pitch": {
        "features": ["pitch_variability"],
        "target": "pitch_rating"
    },
    "loudness": {
        "features": ["loudness_variance"],
        "target": "loudness_rating"
    }
}

# ---------------------------------------------------
# TRAIN LOOP
# ---------------------------------------------------

for model_name, config in MODELS.items():
    print(f"\nTraining {model_name.upper()} model")

    X = df[config["features"]]
    y = df[config["target"]]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )

    model = RandomForestRegressor(
        n_estimators=200,
        random_state=RANDOM_STATE
    )

    model.fit(X_train, y_train)

    # Evaluate
    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    print(f"MSE: {mse:.3f}")
    print(f"R² : {r2:.3f}")

    # Save model
    model_path = os.path.join(MODEL_DIR, f"{model_name}_model.joblib")
    joblib.dump(model, model_path)

    print(f"Saved → {model_path}")

print("\nAll models trained and saved.")
