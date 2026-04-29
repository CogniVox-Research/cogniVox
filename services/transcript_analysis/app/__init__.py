from pydantic import BaseModel

from . import grammar, util
from .config import config
from .transcript import comparer

__all__ = ["app", "config"]

from fastapi import FastAPI

app = FastAPI()


class SimilarityCheckReq(BaseModel):
    expected_text: str
    speech_text: str


@app.get("/health")
async def health():
    return "OK"


@app.post("/")
def check_similarity(req: SimilarityCheckReq):
    similarity_results = comparer.compare(req.expected_text, req.speech_text)
    grammar_results = grammar.checker.check_errors(req.speech_text)

    response = {
        "similarity": util.convert_numpy_to_python(similarity_results),
        "grammar": grammar_results,
    }

    print(response)
    return response
