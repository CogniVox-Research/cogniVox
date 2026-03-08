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


def evaluate_interview_answers(questions_with_answers: list[dict]) -> dict:
    """
    Evaluate user answers against expected sample answers.
    
    Args:
        questions_with_answers: Array of dicts with keys:
            - question: str
            - sample_answer: str
            - user_answer: str
    
    Returns:
        dict with:
            - overall_score: int (0-5, count of matching answers)
            - results: array of evaluation per question
                - question: str
                - matching_percentage: float (0-100)
                - is_matching: int (1 or 0)
    """
    client = genai.Client(api_key=settings.gemini_api_key)
    
    prompt = f"""You are an expert interview evaluator. Evaluate each user answer against the expected sample answer.

For each question-answer pair, determine:
1. A matching percentage (0-100) indicating how well the user's answer aligns with the expected answer in content, relevance, and quality.
2. A binary match decision (1 or 0):
   - 1 = The answer is acceptable (>=60% match in content/intent/quality)
   - 0 = The answer is not acceptable (<60% match)

Consider:
- Semantic similarity (not exact wording)
- Key concepts covered
- Relevance and accuracy
- Completeness of the response

Return ONLY valid JSON with this exact structure:
{{
  "evaluations": [
    {{
      "matching_percentage": 85.0,
      "is_matching": 1
    }},
    ...
  ]
}}

Questions and Answers to evaluate:
{json.dumps(questions_with_answers, indent=2)}"""
    
    response = client.models.generate_content(model=settings.gemini_model, contents=prompt)
    text = response.text.strip()
    
    # Remove markdown code blocks if present
    if text.startswith("```"):
        text = "\n".join(line for line in text.split("\n") if not line.startswith("```"))
    
    data = json.loads(text)
    evaluations = data.get("evaluations", [])
    
    # Build response with question context
    results = []
    overall_score = 0
    
    for i, (qa, evaluation) in enumerate(zip(questions_with_answers, evaluations)):
        is_matching = evaluation.get("is_matching", 0)
        overall_score += is_matching
        
        results.append({
            "question": qa["question"],
            "matching_percentage": float(evaluation.get("matching_percentage", 0)),
            "is_matching": int(is_matching),
        })
    
    return {
        "overall_score": overall_score,
        "results": results,
    }
