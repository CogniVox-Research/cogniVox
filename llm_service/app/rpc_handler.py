from . import DocumentService
from .llm import generate_content


class LLMRPCServer:
    def __init__(self, docs: DocumentService) -> None:
        self.docs = docs

    async def get_continue_for(self, session_id: str, current_text: str):
        content = await self.docs.get_transcript(session_id)
        input_text = f"Expected transcript: {content['text']}\nCurrent speech: {current_text}\nNext sentence:"
        return generate_content(input_text)
