import re

import librosa
import numpy as np
from audioread import audio_open
from scipy.signal import find_peaks

# ---------------------------------------------------
# AUDIO LOADING (hardware-independent)
# ---------------------------------------------------


def load_audio(path):
    data = audio_open(path)
    audio, sr = librosa.load(data, sr=16000)
    audio = librosa.util.normalize(audio)
    return audio, sr


# ---------------------------------------------------
# VOICED DURATION (Fluency)
# ----------------------------------------------------
def compute_voiced_duration(audio, sr):
    """
    Compute voiced duration using both pitch and energy.
    Prevents silence/noise from being counted as voiced.
    """
    # Pitch
    f0 = librosa.yin(audio, fmin=50, fmax=400, sr=sr)

    # Energy (RMS)
    rms = librosa.feature.rms(y=audio)[0]

    # Normalize RMS for robustness
    rms = rms / np.max(rms + 1e-8)

    # Voicing conditions:
    # 1. Valid pitch
    # 2. Sufficient energy
    voiced_frames = (f0 > 0) & (rms > 0.1)

    hop_length = 512
    voiced_duration = np.sum(voiced_frames) * hop_length / sr

    return float(voiced_duration)


def detect_pauses(audio, sr, rms_threshold=0.1, min_pause_duration=0.4):
    """
    Detect pauses based on low energy.
    Returns a list of pause dicts with start, end, duration (seconds).
    """

    rms = librosa.feature.rms(y=audio)[0]
    rms = rms / np.max(rms + 1e-8)

    hop_length = 512
    frame_duration = hop_length / sr

    silent = rms < rms_threshold

    pauses = []
    current_start = None
    current_duration = 0.0

    for i, is_silent in enumerate(silent):
        t = i * frame_duration

        if is_silent:
            if current_start is None:
                current_start = t
            current_duration += frame_duration
        else:
            if current_duration >= min_pause_duration:
                pauses.append(
                    {
                        "start": current_start,
                        "end": current_start + current_duration,
                        "duration": current_duration,
                    }
                )
            current_start = None
            current_duration = 0.0

    # Catch trailing pause
    if current_duration >= min_pause_duration:
        pauses.append(
            {
                "start": current_start,
                "end": current_start + current_duration,
                "duration": current_duration,
            }
        )

    return pauses


def merge_close_pauses(pauses, gap_threshold=0.3):
    """
    Merge pauses separated by very short speech gaps.
    """

    if not pauses:
        return pauses

    merged = [pauses[0]]

    for p in pauses[1:]:
        prev = merged[-1]

        # If gap between pauses is very small, merge them
        if p["start"] - prev["end"] <= gap_threshold:
            prev["end"] = p["end"]
            prev["duration"] = prev["end"] - prev["start"]
        else:
            merged.append(p)

    return merged


def compute_pause_metrics(pauses):
    if not pauses:
        return {"avg_pause": 0.0, "max_pause": 0.0, "pause_count": 0}

    durations = [p["duration"] for p in pauses]

    return {
        "avg_pause": float(np.mean(durations)),
        "max_pause": float(np.max(durations)),
        "pause_count": int(len(durations)),
    }


# ---------------------------------------------------
# PITCH VARIABILITY (Prosody)
# ---------------------------------------------------


def compute_pitch_variability(audio, sr):
    f0 = librosa.yin(audio, fmin=50, fmax=400, sr=sr)
    f0 = f0[f0 > 0]  # Keep voiced frames only

    if len(f0) < 20:
        return 0.0

    # Convert pitch to perceptual scale (semitones)
    # log2 models human pitch perception (ratio-based, not linear in Hz).
    # Using the median as baseline provides speaker normalization and
    # robustness to emphasis and pitch-tracking outliers.
    # Multiplying by 12 converts octaves to semitones (human-relevant units).
    f0_st = 12 * np.log2(f0 / np.median(f0))

    # Remove outliers using IQR filtering (robust to pitch estimation errors)
    q1, q3 = np.percentile(f0_st, [25, 75])
    iqr = q3 - q1
    f0_clean = f0_st[(f0_st >= q1 - 1.5 * iqr) & (f0_st <= q3 + 1.5 * iqr)]

    if len(f0_clean) < 20:
        return 0.0

    # Robust pitch variability using Median Absolute Deviation (MAD)
    # MAD is preferred over standard deviation as it is less sensitive
    # to outliers and extreme intonation.
    pitch_variability = np.median(np.abs(f0_clean - np.median(f0_clean)))

    return float(pitch_variability)


# ---------------------------------------------------
# SYLLABLE ESTIMATION (Articulation)
# ---------------------------------------------------


def estimate_syllables(audio, sr):
    # Band-pass filter to focus on speech energy (vowel-dominant region)
    audio = librosa.effects.preemphasis(audio)

    # Amplitude envelope (smoothed)
    envelope = np.abs(audio)
    envelope = librosa.util.normalize(envelope)

    # Smooth envelope (~50 ms window)
    win_size = int(0.05 * sr)
    envelope_smooth = np.convolve(envelope, np.ones(win_size) / win_size, mode="same")

    # Adaptive threshold (robust to loudness differences)
    threshold = np.percentile(envelope_smooth, 75)

    # Minimum distance between syllables (~120 ms → max ~8 syll/sec)
    min_distance = int(0.12 * sr)

    peaks, _ = find_peaks(envelope_smooth, height=threshold, distance=min_distance)

    return int(len(peaks))


def compute_articulation_rate(syllables, voiced_duration):
    """
    Articulation rate (syllables per second of voiced speech).

    Uses voiced duration instead of total duration to avoid
    penalizing pauses and silence.
    """
    return float(syllables / voiced_duration) if voiced_duration > 0 else 0.0


# ---------------------------------------------------
# PAUSE DETECTION (Whisper timestamps)
# ---------------------------------------------------


def compute_avg_pause(segments):
    pauses = []

    for i in range(1, len(segments)):
        prev_end = segments[i - 1]["end"]
        curr_start = segments[i]["start"]
        pause = curr_start - prev_end

        if pause > 0:
            pauses.append(pause)

    return float(np.mean(pauses)) if pauses else 0.0


# ---------------------------------------------------
# FILLED PAUSES (Transcript-based)
# ---------------------------------------------------


def detect_filled_pauses(transcript):
    if not transcript:
        return 0

    transcript = transcript.lower()
    pattern = r"\b(u+h+|u+m+|um+|uh+|ah+|erm+|hmm+|eh+)\b"
    matches = re.findall(pattern, transcript)

    return int(len(matches))


# ---------------------------------------------------
# DISFLUENCIES (Repeated words)
# ---------------------------------------------------


def detect_disfluencies(transcript):
    if not transcript:
        return 0

    words = transcript.lower().split()
    count = 0

    for i in range(1, len(words)):
        if words[i] == words[i - 1]:
            count += 1

    return int(count)


# ---------------------------------------------------
# MAIN METRIC EXTRACTION (PURE FUNCTION)
# ---------------------------------------------------


def extract_metrics(audio_path, transcript, segments):
    """
    Input:
        audio_path : str
        transcript : str (from ASR)
        segments   : list (Whisper timestamps)

    Output:
        dict of speech metrics
    """

    audio, sr = load_audio(audio_path)
    duration = librosa.get_duration(y=audio, sr=sr)

    syllables = estimate_syllables(audio, sr)
    voiced_duration = compute_voiced_duration(audio, sr)

    word_count = len(transcript.split()) if transcript else 0
    wpm = (word_count / duration) * 60 if duration > 0 else 0.0

    pauses = detect_pauses(audio, sr)
    pauses = merge_close_pauses(pauses)
    pause_metrics = compute_pause_metrics(pauses)

    rms = librosa.feature.rms(y=audio)[0]

    return {
        "wpm": float(wpm),
        "avg_pause": pause_metrics["avg_pause"],
        "max_pause": pause_metrics["max_pause"],
        "pause_count": pause_metrics["pause_count"],
        "pitch_variability": compute_pitch_variability(audio, sr),
        "disfluencies": detect_disfluencies(transcript),
        "filled_pauses": detect_filled_pauses(transcript),
        "loudness_variance": float(np.var(rms)),
        "articulation_rate": compute_articulation_rate(syllables, voiced_duration),
    }
