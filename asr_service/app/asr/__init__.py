from whisperlivekit import TranscriptionEngine, AudioProcessor, parse_args


def create_engine():
    return TranscriptionEngine(model_size="medium")
