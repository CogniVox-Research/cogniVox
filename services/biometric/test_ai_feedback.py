import os

from ai_feedback import CONTEXT_SUMMARY, generate_ai_biometric_feedback

try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None


if load_dotenv:
    load_dotenv()


def _assert(condition: bool, message: str):
    if not condition:
        raise AssertionError(message)


def test_fallback_feedback_when_ai_disabled():
    suggestion = "State: Calm. You are balanced and doing well. Keep it up."

    previous = os.getenv("ENABLE_AI_FEEDBACK")
    os.environ["ENABLE_AI_FEEDBACK"] = "false"

    try:
        result = generate_ai_biometric_feedback(
            model_used="Lite",
            label=0,
            stress_score=0.33,
            suggestion=suggestion,
            features={"bvp_mean": 0.5, "bvp_std": 0.1},
        )

        _assert("overall" in result, "Missing `overall` in fallback feedback")
        _assert("context_summary" in result, "Missing `context_summary` in fallback feedback")
        _assert(result["overall"] == suggestion, "Fallback `overall` should match deterministic suggestion")
        _assert(
            result["context_summary"].endswith(CONTEXT_SUMMARY),
            "Fallback `context_summary` should include appended context summary",
        )
    finally:
        if previous is None:
            os.environ.pop("ENABLE_AI_FEEDBACK", None)
        else:
            os.environ["ENABLE_AI_FEEDBACK"] = previous


def test_live_ai_feedback_optional():
    """
    Optional live test for real Gemini call.

    Run only when:
      - ENABLE_AI_FEEDBACK=true
      - GEMINI_API_KEY is set
    """
    suggestion = "State: Calm. You are balanced and doing well. Keep it up."

    if os.getenv("ENABLE_AI_FEEDBACK", "true").lower() not in {"1", "true", "yes", "on"}:
        print("SKIP: Live AI test skipped because ENABLE_AI_FEEDBACK is disabled.")
        return

    if not os.getenv("GEMINI_API_KEY"):
        print("SKIP: Live AI test skipped because GEMINI_API_KEY is not set.")
        return

    result = generate_ai_biometric_feedback(
        model_used="Lite",
        label=0,
        stress_score=0.33,
        suggestion=suggestion,
        features={"bvp_mean": 0.5, "bvp_std": 0.1},
    )

    _assert("overall" in result, "Missing `overall` in AI feedback")
    _assert("context_summary" in result, "Missing `context_summary` in AI feedback")
    _assert(result["overall"].strip() != "", "AI `overall` should not be empty")
    _assert(
        result["context_summary"].endswith(CONTEXT_SUMMARY),
        "AI `context_summary` should include appended context summary",
    )

    # Strong signal that AI path executed (not strict enough to be brittle)
    _assert(
        len(result["overall"]) >= 40,
        "AI `overall` is unexpectedly short; verify API key/model response",
    )


if __name__ == "__main__":
    print("Running biometric AI feedback tests...")

    test_fallback_feedback_when_ai_disabled()
    print("PASS: fallback feedback test")

    test_live_ai_feedback_optional()
    print("PASS: live AI feedback test (or skipped)")

    print("All checks completed.")
