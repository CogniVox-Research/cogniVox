import librosa
import numpy as np
from scipy.signal import find_peaks
import re


# ---------------------------------------------------
# AUDIO LOADING (hardware-independent)
# ---------------------------------------------------

def load_audio(path):
    audio, sr = librosa.load(path, sr=16000)
    audio = librosa.util.normalize(audio)
    return audio, sr


# ---------------------------------------------------
# PITCH VARIABILITY (Prosody)
# ---------------------------------------------------

def compute_pitch_variability(audio, sr):
    f0 = librosa.yin(audio, fmin=50, fmax=400, sr=sr)
    f0 = f0[f0 > 0]
    return float(np.std(f0)) if len(f0) else 0.0


# ---------------------------------------------------
# SYLLABLE ESTIMATION (Articulation)
# ---------------------------------------------------

def estimate_syllables(audio, sr):
    rms = librosa.feature.rms(y=audio)[0]
    peaks, _ = find_peaks(rms, height=np.mean(rms))
    return int(len(peaks))


def compute_articulation_rate(syllables, duration):
    return float(syllables / duration) if duration > 0 else 0.0


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

    word_count = len(transcript.split()) if transcript else 0
    wpm = (word_count / duration) * 60 if duration > 0 else 0.0

    rms = librosa.feature.rms(y=audio)[0]

    return {
        "wpm": float(wpm),
        "avg_pause": compute_avg_pause(segments),
        "pitch_variability": compute_pitch_variability(audio, sr),
        "disfluencies": detect_disfluencies(transcript),
        "filled_pauses": detect_filled_pauses(transcript),
        "loudness_variance": float(np.var(rms)),
        "articulation_rate": compute_articulation_rate(syllables, duration)
    }
