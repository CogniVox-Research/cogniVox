"""Gemini AI service module for generating interview questions and speech continuations"""

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


def generate_speech_continuation(full_speech: str, delivered_so_far: str) -> dict:
    """Generate continuation hint for a speaker who got stuck during their speech
    
    Args:
        full_speech: The complete prepared speech text
        delivered_so_far: The portion of speech that has been delivered so far
        
    Returns:
        Dictionary with 'continuation_hint' containing the next segment to help speaker continue
    """
    client = genai.Client(api_key=settings.gemini_api_key)
    
    prompt = f"""You are an intelligent speech coach helping a speaker who got stuck during their presentation.

Full Prepared Speech:
{full_speech}

Portion Already Delivered:
{delivered_so_far}

Task: Analyze what comes next in the speech and provide a smart continuation hint that helps the speaker remember and continue naturally.

Guidelines:
- If the next part is simple, provide a brief paraphrased hint (even just key words or a simplified version)
- If the next part is complex or contains multiple points, provide more context (2-3 sentences if needed)
- Don't just copy the next sentence - rephrase it in a way that triggers the speaker's memory
- Focus on the core idea or key transition that comes next
- Make it natural and conversational, like a helpful prompt

Return ONLY a JSON object with this structure:
{{"continuation_hint": "..."}}

The hint should be intelligent and adaptive to the complexity of what comes next."""
    
    response = client.models.generate_content(model=settings.gemini_model, contents=prompt)
    text = response.text.strip()
    
    # Remove markdown code blocks if present
    if text.startswith("```"):
        text = "\n".join(line for line in text.split("\n") if not line.startswith("```"))
    
    data = json.loads(text)
    
    return {
        "continuation_hint": data.get("continuation_hint", ""),
        "status": "success"
    }
