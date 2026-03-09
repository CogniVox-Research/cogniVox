"""API routes for the LLM Service"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from app.gemini_service import generate_interview_questions, generate_speech_continuation

router = APIRouter()


class CVRequest(BaseModel):
    cv_content: str
    
    @field_validator('cv_content', mode='before')
    def clean_cv_content(cls, v):
        """Clean and normalize CV content"""
        if isinstance(v, str):
            # Strip leading/trailing whitespace
            v = v.strip()
            # Handle common escape sequences
            v = v.replace('\\n', '\n')
            v = v.replace('\\t', '\t')
            v = v.replace('\\r', '\r')
            return v
        return v


class ContinuationRequest(BaseModel):
    full_speech: str
    delivered_so_far: str
    
    @field_validator('full_speech', 'delivered_so_far', mode='before')
    def clean_text(cls, v):
        """Clean and normalize text content"""
        if isinstance(v, str):
            v = v.strip()
            v = v.replace('\\n', '\n')
            v = v.replace('\\t', '\t')
            v = v.replace('\\r', '\r')
            return v
        return v


@router.post("/generate-interview-questions")
async def generate_questions(request: CVRequest):
    """Generate 5 interview questions from CV content"""
    try:
        result = generate_interview_questions(request.cv_content)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate-continuation-hint")
async def generate_continuation(request: ContinuationRequest):
    """Generate speech continuation hint to help speaker continue after getting stuck"""
    try:
        result = generate_speech_continuation(
            request.full_speech,
            request.delivered_so_far
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
