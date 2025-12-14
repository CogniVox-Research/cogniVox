from feedback.generate_feedback import generate_feedback

scores = {
    "clarity": 4,
    "pace": 2,
    "pauses": 3,
    "pitch": 1,
    "loudness": 4
}

feedback = generate_feedback(scores)

for k, v in feedback.items():
    print(f"{k}: {v}")
