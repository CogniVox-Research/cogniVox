from whisperlivekit import TranscriptionEngine, AudioProcessor, parse_args


def create_engine():
    return TranscriptionEngine(target_language="en", model_size="large")
