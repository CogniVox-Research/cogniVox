"""API routes for the LLM Service"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from app.gemini_service import generate_interview_questions, generate_stress_management_plan

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

class StressSummaryRequest(BaseModel):
    avg_stress: float
    max_stress: float
    high_stress_events: int
    duration_seconds: float


@router.post("/generate-interview-questions")
async def generate_questions(request: CVRequest):
    """Generate 5 interview questions from CV content"""
    try:
        result = generate_interview_questions(request.cv_content)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-stress-management-plan")
async def generate_stress_plan(request: StressSummaryRequest):
    """Generate a stress management plan from a stress metrics summary"""
    try:
        result = generate_stress_management_plan(request.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
