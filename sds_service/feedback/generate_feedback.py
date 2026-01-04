# ---------------------------------------------------
# FEEDBACK GENERATION (RULE-BASED)
# ---------------------------------------------------

def clarity_feedback(score):
    if score <= 2:
        return "Your speech lacks clarity. Reduce filler words and improve articulation."
    elif score == 3:
        return "Your speech is understandable, but clarity can be improved with cleaner delivery."
    else:
        return "Your speech is clear and easy to understand."


def pace_feedback(score):
    if score <= 2:
        return "Your speaking pace is off. Aim for a more balanced speed."
    elif score == 3:
        return "Your pace is acceptable, but could be slightly more engaging."
    else:
        return "Your speaking pace is well controlled."


def pauses_feedback(score):
    if score <= 2:
        return "Your pauses feel awkward or too long. Try making them more intentional."
    elif score == 3:
        return "Your pause management is okay, but smoother timing would help."
    else:
        return "Your pauses are well timed and natural."


def pitch_feedback(score):
    if score <= 2:
        return "Your voice sounds monotone. Add pitch variation to emphasize key points."
    elif score == 3:
        return "Your pitch variation is moderate, but more expressiveness would help."
    else:
        return "Your pitch variation adds expressiveness to your speech."


def loudness_feedback(score):
    if score <= 2:
        return "Your projection is weak. Speak louder and with more confidence."
    elif score == 3:
        return "Your loudness is acceptable, but stronger projection would help."
    else:
        return "Your loudness and projection are strong and consistent."


# ---------------------------------------------------
# FINAL FEEDBACK ENTRY POINT
# ---------------------------------------------------

def generate_feedback(scores):
    """
    Input:
        scores: dict with integer values 1–5

    Output:
        dict with textual feedback
    """
    return {
        "clarity": clarity_feedback(scores["clarity"]),
        "pace": pace_feedback(scores["pace"]),
        "pauses": pauses_feedback(scores["pauses"]),
        "pitch": pitch_feedback(scores["pitch"]),
        "loudness": loudness_feedback(scores["loudness"]),
    }
