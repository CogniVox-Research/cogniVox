"""
AI-powered feedback generation for biometric stress predictions.
"""

import os


CONTEXT_SUMMARY = (
    "This biometric signal estimate is a wellness indicator, not a medical diagnosis. "
    "Use trends over time and pair this with healthy recovery habits."
)


def _enabled() -> bool:
    return os.getenv("ENABLE_AI_FEEDBACK", "true").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def _fallback_feedback(suggestion: str) -> dict:
    overall = suggestion
    return {
        "overall": overall,
        "context_summary": f"{overall} {CONTEXT_SUMMARY}",
    }


def generate_ai_biometric_feedback(
    *,
    model_used: str,
    label: int,
    stress_score: float,
    suggestion: str,
    features: dict,
) -> dict:
    """
    Generate an overall 3-5 sentence feedback summary from prediction outputs.

    Falls back to deterministic suggestion when disabled/misconfigured/errors.
    """
    if not _enabled():
        return _fallback_feedback(suggestion)

    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    if not api_key:
        return _fallback_feedback(suggestion)

    try:
        import google.genai as genai

        client = genai.Client(api_key=api_key)

        # Keep only present numeric features to avoid noisy prompt payloads
        present_features = {
            k: v for k, v in features.items() if isinstance(v, (int, float)) and v is not None
        }

        state = "stressed" if label == 1 else "not stressed"

        prompt = f"""You are a supportive wellness coach.

Model used: {model_used}
Predicted state: {state}
Stress score: {stress_score:.3f} (0.0 to 1.0)
Deterministic suggestion: {suggestion}
Feature snapshot: {present_features}

Task:
- Write 3-5 sentences of overall feedback.
- Acknowledge current state and confidence implied by score.
- Give 1-2 practical next steps.
- Be calm, concise, and non-judgmental.
- Do not provide diagnosis, treatment claims, or medical certainty.
- Do not output JSON.
"""

        response = client.models.generate_content(model=model, contents=prompt)
        overall = (response.text or "").strip()

        if not overall:
            return _fallback_feedback(suggestion)

        return {
            "overall": overall,
            "context_summary": f"{overall} {CONTEXT_SUMMARY}",
        }
    except Exception:
        return _fallback_feedback(suggestion)
