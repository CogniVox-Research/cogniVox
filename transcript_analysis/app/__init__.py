from .transcript import SpeechComparer
from .config import config
from pydantic import BaseModel

__all__ = ["app", "config"]

from fastapi import FastAPI

app = FastAPI()

print(config)

class SimilarityCheckReq(BaseModel):
    expected_text: str
    speech_text: str

@app.post("/")
def check_similarity(req: SimilarityCheckReq):
    comparer = SpeechComparer()
    results = comparer.compare(req.expected_text, req.speech_text)
    return results