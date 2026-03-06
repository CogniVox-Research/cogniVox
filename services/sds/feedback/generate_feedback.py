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
# CONTEXT-AWARE THRESHOLDS
# Derived from scenario-specific dataset distributions
# ---------------------------------------------------
#
# Thresholds represent what "good enough" means per context:
#
#  1-on-1:    Clarity & Pace matter most → higher bar for those
#             Loudness & Pitch less critical → lower bar
#
#  Boardroom: Pitch (tone steadiness) & Clarity matter most
#             Filler words penalized → higher filled_pauses sensitivity
#             Loudness moderate bar
#
#  Mass:      Loudness & Pitch variation matter most → higher bar
#             Clarity still needed but secondary

CONTEXT_THRESHOLDS = {
    "1": {  # One-on-One
        "clarity":  {"poor": 2.5, "adequate": 3.5, "good": 4.0},
        "pace":     {"poor": 2.5, "adequate": 3.5, "good": 4.0},
        "pauses":   {"poor": 2.0, "adequate": 3.0, "good": 3.5},
        "pitch":    {"poor": 2.0, "adequate": 3.0, "good": 3.5},
        "loudness": {"poor": 2.0, "adequate": 2.5, "good": 3.0},  # Low bar — intimate setting
    },
    "2": {  # Boardroom
        "clarity":  {"poor": 2.5, "adequate": 3.5, "good": 4.0},
        "pace":     {"poor": 2.5, "adequate": 3.5, "good": 4.0},
        "pauses":   {"poor": 2.5, "adequate": 3.5, "good": 4.0},
        "pitch":    {"poor": 3.0, "adequate": 3.5, "good": 4.5},  # High bar — tone steadiness critical
        "loudness": {"poor": 2.5, "adequate": 3.0, "good": 3.5},
    },
    "3": {  # Mass Speech
        "clarity":  {"poor": 2.5, "adequate": 3.0, "good": 3.5},
        "pace":     {"poor": 2.5, "adequate": 3.0, "good": 3.5},
        "pauses":   {"poor": 2.0, "adequate": 3.0, "good": 3.5},
        "pitch":    {"poor": 3.0, "adequate": 3.5, "good": 4.5},  # High bar — variation essential
        "loudness": {"poor": 3.0, "adequate": 3.5, "good": 4.5},  # High bar — projection essential
    },
}

# Priority metrics per context (most important listed first)
# Used to order feedback and highlight what matters most
CONTEXT_PRIORITIES = {
    "1": ["clarity", "pace", "pauses", "pitch", "loudness"],
    "2": ["pitch", "clarity", "pace", "pauses", "loudness"],
    "3": ["loudness", "pitch", "clarity", "pace", "pauses"],
}

# ---------------------------------------------------
# FEEDBACK TEMPLATES PER METRIC
# 4 levels: critical / poor / adequate / good
# Each has a generic version + context-specific override
# ---------------------------------------------------

FEEDBACK_TEMPLATES = {
    "clarity": {
        "critical": {
            "generic":    "Your speech is very hard to follow. Reduce filler words significantly and focus on clean articulation.",
            "1":          "In a 1-on-1 conversation, clarity is essential. Your listener will struggle to follow you — slow down and articulate.",
            "2":          "In a boardroom setting, unclear speech undermines credibility. Eliminate fillers and sharpen your delivery.",
            "3":          "A large audience cannot follow unclear speech. Work on eliminating disfluencies before speaking to a crowd.",
        },
        "poor": {
            "generic":    "Your clarity needs improvement. Focus on reducing disfluencies and speaking more cleanly.",
            "1":          "For a 1-on-1 conversation, your clarity is below par. Your partner may ask for repetition often.",
            "2":          "Boardroom audiences expect polished delivery. Reduce filler words and improve articulation.",
            "3":          "Mass audiences lose engagement quickly with unclear speakers. Prioritize clean articulation.",
        },
        "adequate": {
            "generic":    "Your clarity is acceptable but has room to improve. Fewer filler words would help.",
            "1":          "Clarity is good enough for casual 1-on-1s, but cleaner delivery would build more trust.",
            "2":          "Adequate for a boardroom, but stakeholders will respond better to more polished speech.",
            "3":          "Acceptable, but larger audiences benefit from sharper clarity. Keep refining.",
        },
        "good": {
            "generic":    "Your speech is clear and easy to follow.",
            "1":          "Excellent clarity for a 1-on-1 — your listener can follow you effortlessly.",
            "2":          "Your clarity is strong — well suited for boardroom communication.",
            "3":          "Good clarity, which provides a solid foundation even in a large audience setting.",
        },
    },

    "pace": {
        "critical": {
            "generic":    "Your pace is severely off — either too fast or too slow to follow.",
            "1":          "In a 1-on-1, an extreme pace kills natural conversation flow. Aim for a steady, conversational rhythm.",
            "2":          "Boardroom delivery requires controlled pace. Rushing or dragging loses your audience immediately.",
            "3":          "A large audience cannot adjust to extreme pace. You will lose the room — stabilize your tempo.",
        },
        "poor": {
            "generic":    "Your pace needs work. Aim for a more consistent and comfortable speaking speed.",
            "1":          "Your pace feels unnatural for a 1-on-1. A more conversational rhythm would help.",
            "2":          "Boardroom audiences expect steady, purposeful pacing. Work on consistency.",
            "3":          "Inconsistent pace in a mass speech context reduces impact. Aim for deliberate tempo control.",
        },
        "adequate": {
            "generic":    "Your pace is acceptable but could be more engaging.",
            "1":          "Pace is fine for a 1-on-1, though a slightly more relaxed rhythm could feel more natural.",
            "2":          "Pace works for a boardroom, but more deliberate variation could strengthen key points.",
            "3":          "Acceptable pace, but mass speeches benefit from intentional tempo shifts for emphasis.",
        },
        "good": {
            "generic":    "Your speaking pace is well controlled and engaging.",
            "1":          "Great conversational pace — well suited for 1-on-1 interaction.",
            "2":          "Your pace is professional and well controlled — ideal for a boardroom.",
            "3":          "Strong pace control, which helps maintain engagement across a large audience.",
        },
    },

    "pauses": {
        "critical": {
            "generic":    "Your pauses are severely disruptive — either too frequent, too long, or absent entirely.",
            "1":          "In a 1-on-1, disruptive pauses break conversational flow. Practice more natural timing.",
            "2":          "In a boardroom, poor pause management signals nervousness or lack of preparation.",
            "3":          "Large audiences need intentional pauses for impact. Yours are undermining your delivery.",
        },
        "poor": {
            "generic":    "Your pause management needs improvement. Pauses should feel intentional.",
            "1":          "Pauses feel awkward in this conversational context. Work on more natural timing.",
            "2":          "Boardroom delivery benefits from purposeful pauses. Yours feel uncontrolled.",
            "3":          "Pauses lack the intentionality needed to create impact in a mass speech setting.",
        },
        "adequate": {
            "generic":    "Your pause timing is okay, but smoother and more intentional pauses would help.",
            "1":          "Pauses are acceptable in a 1-on-1, though more natural timing would improve flow.",
            "2":          "Pause timing works for a boardroom but could be more deliberate for maximum impact.",
            "3":          "Pauses are adequate, but in mass speeches, strategic pauses create powerful moments.",
        },
        "good": {
            "generic":    "Your pauses are well timed and natural.",
            "1":          "Your pauses feel natural and conversational — perfect for a 1-on-1.",
            "2":          "Excellent pause control — your delivery feels confident and well prepared.",
            "3":          "Strong pause management — you are using silence effectively to command attention.",
        },
    },

    "pitch": {
        "critical": {
            "generic":    "Your voice is extremely monotone. Add significant pitch variation to engage listeners.",
            "1":          "Even in a 1-on-1, a flat voice signals disengagement. Add warmth and variation.",
            "2":          "A monotone voice in a boardroom signals low confidence or disinterest. This needs immediate work.",
            "3":          "A completely flat voice will lose a mass audience very quickly. Pitch variation is non-negotiable here.",
        },
        "poor": {
            "generic":    "Your pitch variation is low. Work on adding more expressiveness to your voice.",
            "1":          "Your voice sounds flat for a 1-on-1. More natural tonal variation would build better rapport.",
            "2":          "Boardroom communication depends on tonal clarity. More pitch variation would improve your authority.",
            "3":          "Mass speeches require strong pitch variation to maintain audience energy. This needs significant work.",
        },
        "adequate": {
            "generic":    "Your pitch variation is moderate. More expressiveness would improve engagement.",
            "1":          "Pitch is adequate for a 1-on-1, though more warmth in your tone would strengthen connection.",
            "2":          "Tone is acceptable in a boardroom context, but more deliberate variation would convey stronger authority.",
            "3":          "Pitch variation is present but not strong enough for a mass audience. Push for more expressive range.",
        },
        "good": {
            "generic":    "Your pitch variation adds expressiveness and keeps listeners engaged.",
            "1":          "Good tonal variation — your voice feels warm and engaging in a 1-on-1 setting.",
            "2":          "Strong pitch control — your voice conveys authority and confidence in a boardroom.",
            "3":          "Excellent pitch variation — you are commanding attention effectively across a large audience.",
        },
    },

    "loudness": {
        "critical": {
            "generic":    "Your projection is critically weak or wildly inconsistent. This must be addressed.",
            "1":          "Even in a quiet 1-on-1 setting, your volume is too inconsistent to follow comfortably.",
            "2":          "In a boardroom, extremely poor projection signals lack of confidence. This needs immediate work.",
            "3":          "A mass audience simply cannot hear or follow you at this projection level. This is critical.",
        },
        "poor": {
            "generic":    "Your projection needs improvement. Speak with more confidence and consistency.",
            "1":          "Projection is below par even for an intimate setting. Work on vocal consistency.",
            "2":          "Boardroom audiences expect confident projection. Yours needs strengthening.",
            "3":          "Mass speeches demand strong, consistent projection. Yours falls well short of what is needed.",
        },
        "adequate": {
            "generic":    "Your loudness is acceptable, but stronger projection would help.",
            "1":          "Projection is fine for a 1-on-1 — no issues in an intimate setting.",
            "2":          "Acceptable projection for a boardroom, but more confident delivery would increase impact.",
            "3":          "Adequate, but mass speeches benefit greatly from stronger, more consistent projection.",
        },
        "good": {
            "generic":    "Your loudness and projection are strong and consistent.",
            "1":          "Good projection — well calibrated for an intimate 1-on-1 conversation.",
            "2":          "Strong projection — you command the room with confident vocal delivery.",
            "3":          "Excellent projection — your voice carries well and commands a large audience.",
        },
    },
}

# ---------------------------------------------------
# CONTEXT SUMMARIES
# Shown as the overall guidance message
# ---------------------------------------------------

CONTEXT_SUMMARIES = {
    "1": "In 1-on-1 conversations, clarity and natural pace build trust and understanding.",
    "2": "In boardroom settings, tone steadiness and polished delivery reflect competence and authority.",
    "3": "In mass speeches, strong projection and pitch variation are essential to command and retain a large audience.",
}


# ---------------------------------------------------
# CORE FEEDBACK RESOLVER
# ---------------------------------------------------

def _resolve_level(score, thresholds):
    """
    Map a numeric score to a feedback level based on context thresholds.
    Returns: 'critical' | 'poor' | 'adequate' | 'good'
    """
    if score <= thresholds["poor"] - 1.0:
        return "critical"
    elif score <= thresholds["poor"]:
        return "poor"
    elif score <= thresholds["adequate"]:
        return "adequate"
    else:
        return "good"


def _get_feedback(metric, score, speech_type_value):
    """
    Get context-aware feedback for a single metric.
    Falls back to generic if no speech type provided.
    """
    thresholds = CONTEXT_THRESHOLDS.get(speech_type_value, CONTEXT_THRESHOLDS["2"])
    level = _resolve_level(score, thresholds[metric])
    template = FEEDBACK_TEMPLATES[metric][level]

    # Use context-specific message if available, else generic
    return template.get(speech_type_value, template["generic"])


# ---------------------------------------------------
# FINAL FEEDBACK ENTRY POINT
# ---------------------------------------------------

def generate_feedback(scores, speech_type=None):
    """
    Generate context-aware, threshold-adjusted feedback.

    Input:
        scores:      dict with numeric values 1–5 per metric
        speech_type: SpeechType enum or string ("1", "2", "3")

    Output:
        dict with:
            - per-metric feedback strings (ordered by context priority)
            - 'context_summary': overall guidance for the speech type
            - 'priority_metric': the most important metric for this context
    """
    speech_type_value = (
        speech_type.value if hasattr(speech_type, "value") else str(speech_type)
    ) if speech_type else None

    # Build feedback ordered by context priority
    priority_order = CONTEXT_PRIORITIES.get(speech_type_value, list(scores.keys()))

    feedback = {}
    for metric in priority_order:
        if metric in scores:
            feedback[metric] = _get_feedback(metric, scores[metric], speech_type_value)

    # Add context summary
    feedback["context_summary"] = CONTEXT_SUMMARIES.get(
        speech_type_value,
        "Focus on clear delivery and confident projection."
    )

    # Highlight the most critical metric for this context
    feedback["priority_metric"] = priority_order[0] if priority_order else "clarity"

    return feedback

