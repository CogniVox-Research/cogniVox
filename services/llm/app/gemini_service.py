"""Gemini AI service module for generating interview questions"""

import json
import google.genai as genai
from app.config import settings


def generate_interview_questions(cv_content: str) -> dict:
    """Generate 5 interview questions and sample answers from CV content"""
    client = genai.Client(api_key=settings.gemini_api_key)
    
    prompt = f"""Based on this CV, generate exactly 5 interview questions and sample answers.

Return ONLY valid JSON array with this structure:
[
    {{"question": "...", "sample_answer": "..."}},
    ...
]

CV Content:
{cv_content}"""
    
    response = client.models.generate_content(model=settings.gemini_model, contents=prompt)
    text = response.text.strip()
    
    # Remove markdown code blocks if present
    if text.startswith("```"):
        text = "\n".join(line for line in text.split("\n") if not line.startswith("```"))
    
    data = json.loads(text)
    
    return {
        "questions_and_answers": data,
        "total_questions": len(data)
    }
