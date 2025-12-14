from scoring.score_speech import score_speech

metrics = {
    "wpm": 150,
    "avg_pause": 0.30,
    "pitch_variability": 70,
    "disfluencies": 1,
    "filled_pauses": 2,
    "loudness_variance": 0.005,
    "articulation_rate": 3.2,
}


scores = score_speech(metrics)  # metrics from extract_metrics
print(scores)
