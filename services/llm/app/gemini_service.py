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

def generate_stress_management_plan(stress_summary: dict) -> dict:
    """Generate a personalized, long-term stress management plan based on speech stress data"""
    client = genai.Client(api_key=settings.gemini_api_key)
    
    prompt = f"""Based on the following stress metrics collected during a user's speech session, generate a comprehensive, personalized, and long-term stress management plan.
    Provide the response in Markdown format.

Stress details:
- Average Stress Level: {stress_summary.get('avg_stress', 'N/A')}
- Maximum Stress Level: {stress_summary.get('max_stress', 'N/A')}
- Number of High Stress Events: {stress_summary.get('high_stress_events', 'N/A')}
- Session Duration (seconds): {stress_summary.get('duration_seconds', 'N/A')}

Structure the plan with:
1. An encouraging summary of their performance
2. Immediate short-term techniques to manage stress
3. A long-term stress management strategy
4. Specific exercises matching their stress profile

Keep the tone professional, supportive, and actionable. Do not echo back the exact scores, but use them to shape the advice."""

    response = client.models.generate_content(model=settings.gemini_model, contents=prompt)
    text = response.text.strip()
    
    return {
        "plan": text
    }
