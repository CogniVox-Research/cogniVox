"""
Test script for AI-powered feedback generation.

This demonstrates the new AI context summary feature that generates
overall feedback using Google Gemini API.
"""

from scoring.score_speech import score_speech
from scoring.delivery_score import compute_delivery_score
from feedback.generate_feedback import generate_feedback

# Sample metrics (same as your original test case)
metrics = {
    "wpm": 184.7104561737093,
    "avg_pause": 1.3600000000000008,
    "max_pause": 2.0800000000000014,
    "pause_count": 2,
    "pitch_variability": 1.3800205599343365,
    "disfluencies": 0,
    "filled_pauses": 0,
    "loudness_variance": 0.0012825032463297248,
    "articulation_rate": 4.517326732673268,
}

speech_type = "1"  # ONE_ON_ONE

print("=" * 60)
print("SPEECH DELIVERY ANALYSIS WITH AI FEEDBACK")
print("=" * 60)
print()

# 1. Score speech
print("1️⃣  Scoring speech metrics...")
scores = score_speech(metrics, speech_type=speech_type)
print(f"   Scores: {scores}")
print()

# 2. Compute delivery score
print("2️⃣  Computing overall delivery score...")
delivery = compute_delivery_score(scores, speech_type=speech_type)
print(f"   Delivery Score: {delivery['delivery_score']}/5.0 ({delivery['delivery_score_label']})")
print(f"   Weights: {delivery['weights_used']}")
print()

# 3. Generate feedback (with AI context summary)
print("3️⃣  Generating AI-powered feedback...")
feedback = generate_feedback(scores, speech_type=speech_type, delivery_data=delivery)
print()

print("=" * 60)
print("FEEDBACK RESULTS")
print("=" * 60)
print()

for key, value in feedback.items():
    if key == "context_summary":
        print(f"\n📝 {key.upper()}:")
        print(f"   {value}")
    elif key == "priority_metric":
        print(f"\n🎯 {key.upper()}: {value}")
    else:
        print(f"\n• {key.title()}:")
        print(f"  {value}")

print()
print("=" * 60)
print()
print("Note: If you see the basic context summary without AI content,")
print("      make sure to set GEMINI_API_KEY in your .env file.")
print("=" * 60)
