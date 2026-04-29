import os
from contextlib import asynccontextmanager
from typing import Optional

import joblib
import numpy as np
import pydantic
import shared
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from shared import rabbitmq
from typing_extensions import Literal

# Load models
current_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(current_dir, "models")
print(f"DEBUG: Model Dir: {model_dir}")
print(f"DEBUG: CWD: {os.getcwd()}")

try:
    rf_path = os.path.join(model_dir, "cognivox_wesad_rf.joblib")
    print(f"DEBUG: Loading RF from: {rf_path}")
    rf_obj = joblib.load(rf_path)
    rf_model = rf_obj["model"]
    rf_feature_cols = rf_obj["feature_cols"]
except Exception as e:
    print(f"Failed to load RF model: {e}")
    rf_model = None
    rf_feature_cols = []

try:
    lite_path = os.path.join(model_dir, "cognivox_wesad_lite_enhanced.joblib")
    lite_obj = joblib.load(lite_path)
    lite_model = lite_obj["model"]
    lite_feature_cols = lite_obj["feature_cols"]
except Exception as e:
    print(f"Failed to load Lite model: {e}")
    lite_model = None
    lite_feature_cols = []


class FeatureInput(BaseModel):
    # Common or RF specific
    eda_mean: Optional[float] = None
    eda_std: Optional[float] = None
    eda_min: Optional[float] = None
    eda_max: Optional[float] = None
    bvp_mean: float
    bvp_std: float
    temp_mean: Optional[float] = None
    temp_std: Optional[float] = None
    acc_mag_mean: Optional[float] = None
    acc_mag_std: Optional[float] = None

    # Lite specific
    bvp_min: Optional[float] = None
    bvp_max: Optional[float] = None
    bvp_range: Optional[float] = None
    bvp_energy: Optional[float] = None
    acc_mean: Optional[float] = None
    acc_std: Optional[float] = None
    acc_max: Optional[float] = None

    session_id: Optional[str] = None


class StressData(pydantic.BaseModel):
    type: Literal["stress"]
    data: FeatureInput


class Config(shared.config.SharedBaseSettings):
    rabbitmq_url: str = pydantic.Field()
    port: int = pydantic.Field()


config = Config.load()


class StressListener(rabbitmq.QueueListener[FeatureInput]):
    def __init__(self, rabbitmq_url: str):
        super().__init__(
            rabbitmq_url,
            None,
            FeatureInput,
            exchange="stress",
            response_exchange="results",
        )

    async def handle_message(self, message: FeatureInput) -> rabbitmq.Message | None:
        print("Got Request", message)
        session_id = message.session_id
        assert session_id is not None

        response = predict_stress(message)
        print("Response", response)

        return rabbitmq.Message(
            data={"type": "stress", "data": response}, routing_key=session_id
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    with StressListener(config.rabbitmq_url):
        yield


app = FastAPI(lifespan=lifespan)


def predict_stress_from_features_dict(model, feature_cols, feat_dict, threshold=0.6):
    try:
        x = np.array([[feat_dict[col] for col in feature_cols]])
    except KeyError as e:
        raise ValueError(f"Missing feature for selected model: {e}")

    proba = model.predict_proba(x)[0, 1]
    label = 1 if proba >= threshold else 0
    return label, float(proba)


@app.get("health")
def health():
    return "OK"


def generate_suggestion(label, stress_score):
    # Use stress_score for more granular feedback

    # Zone 1: Deep Relaxation (0.0 - 0.2)
    if stress_score < 0.2:
        return (
            "State: Deeply Relaxed. Excellent condition. Great for focus or recovery."
        )

    # Zone 2: Calm / Balanced (0.2 - 0.45)
    elif stress_score < 0.45:
        return "State: Calm. You are balanced and doing well. Keep it up."

    # Zone 3: Mild Arousal / Warning (0.45 - 0.6)
    # Approaching the threshold (0.6)
    elif stress_score < 0.6:
        return "State: Elevated. You may be experiencing slight pressure. Consider a short break soon."

    # Zone 4: Moderate Stress (0.6 - 0.8)
    # The model flipped to label 1 here (>= 0.6)
    elif stress_score < 0.8:
        return "State: Stressed. Detected physiological stress. Try 'Box Breathing' (4s in, 4s hold, 4s out, 4s hold)."

    # Zone 5: High Stress (0.8 - 1.0)
    else:
        return "State: Highly Stressed. Strong markers detected. Stop what you are doing, close your eyes, and take 5 deep breaths."


@app.post("/predict_stress")
def predict_stress_route(input: FeatureInput):
    return predict_stress(input)


def predict_stress(input: FeatureInput):
    feat_dict = input.dict()

    # Logic: If EDA is present, use RF model. Else use Lite model.
    # We check eda_mean as a proxy for EDA data availability.
    use_rf = feat_dict.get("eda_mean") is not None

    if use_rf:
        print("DEBUG: EDA data detected. Using RF Model.")
        if rf_model is None:
            raise HTTPException(status_code=500, detail="RF model is not loaded.")

        model_name = "RF"
        model = rf_model
        cols = rf_feature_cols
    else:
        print("DEBUG: No EDA data detected. Using Lite Model.")
        if lite_model is None:
            raise HTTPException(status_code=500, detail="Lite model is not loaded.")

        model_name = "Lite"
        model = lite_model
        cols = lite_feature_cols

    try:
        label, score = predict_stress_from_features_dict(model, cols, feat_dict)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

    suggestion = generate_suggestion(label, score)
    # ai_feedback = generate_ai_biometric_feedback(
    #     model_used=model_name,
    #     label=int(label),
    #     stress_score=float(score),
    #     suggestion=suggestion,
    #     features=feat_dict,
    # )

    return {
        "model_used": model_name,
        "label": int(label),
        "stress_score": score,
        "suggestion": suggestion,
        "feedback": "ai_feedback",
    }


if __name__ == "__main__":
    import uvicorn

    print("Starting BioSync Server...")
    print(f"Listening on 0.0.0.0:{config.port}")
    uvicorn.run(app, host="0.0.0.0", port=config.port)
