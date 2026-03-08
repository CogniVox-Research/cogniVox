"""
AI-powered overall delivery feedback generation using Gemini AI.

This module integrates with Google's Gemini API to generate contextual
feedback summaries based on speech delivery scores and weights.
"""

import json
import os
import google.genai as genai
from pydantic_settings import BaseSettings


class AIFeedbackSettings(BaseSettings):
    """Settings for AI feedback generation"""
    
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    
    class Config:
        env_file = ".env"


# Initialize settings
try:
    ai_settings = AIFeedbackSettings()
    AI_ENABLED = True
except Exception:
    AI_ENABLED = False
    ai_settings = None


def generate_ai_context_summary(
    scores: dict,
    weights: dict,
    delivery_score: float,
    delivery_label: str,
    speech_type_name: str,
    base_context_summary: str,
) -> str:
    """
    Generate AI-powered overall feedback and append the base context summary.
    
    Args:
        scores: Dict of individual metric scores (1-5)
        weights: Dict of weights applied to each metric
        delivery_score: Overall delivery score (0-5)
        delivery_label: Human-readable label (e.g., "Good", "Needs Work")
        speech_type_name: Speech context ("ONE_ON_ONE", "BOARDROOM", "MASS_SPEECH")
        base_context_summary: Original context-specific guidance to append
        
    Returns:
        AI-generated feedback (3-5 sentences) + base context summary
    """
    if not AI_ENABLED or not ai_settings:
        # Fallback: return base context summary only
        return base_context_summary
    
    try:
        client = genai.Client(api_key=ai_settings.gemini_api_key)
        
        # Build the prompt
        prompt = f"""You are an expert speech coach providing concise delivery feedback.

Speech Context: {speech_type_name.replace('_', ' ').title()}
Overall Delivery Score: {delivery_score}/5.0 ({delivery_label})

Individual Scores (1-5 scale):
- Clarity: {scores.get('clarity', 0):.1f}
- Pace: {scores.get('pace', 0):.1f}
- Pauses: {scores.get('pauses', 0):.1f}
- Pitch: {scores.get('pitch', 0):.1f}
- Loudness: {scores.get('loudness', 0):.1f}

Scoring Weights (importance per metric):
- Clarity: {weights.get('clarity', 0):.2%}
- Pace: {weights.get('pace', 0):.2%}
- Pauses: {weights.get('pauses', 0):.2%}
- Pitch: {weights.get('pitch', 0):.2%}
- Loudness: {weights.get('loudness', 0):.2%}

Task:
Write a cohesive, actionable summary of this speaker's overall delivery performance in 3-5 sentences.
- Acknowledge what they are doing well
- Highlight the most impactful area for improvement based on the weights and scores
- Be encouraging but honest
- Use a professional yet supportive tone
- Do NOT repeat the scores verbatim — synthesize insights

Return ONLY the feedback text. No introductions, no JSON, no extra formatting."""

        response = client.models.generate_content(
            model=ai_settings.gemini_model,
            contents=prompt
        )
        
        ai_feedback = response.text.strip()
        
        # Append the base context summary
        combined_feedback = f"{ai_feedback} {base_context_summary}"
        
        return combined_feedback
        
    except Exception as e:
        # If AI generation fails, fallback to base context summary
        print(f"AI feedback generation failed: {e}")
        return base_context_summary
