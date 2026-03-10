"""API routes for the LLM Service"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
mini_service import generate_interview_questions,
from app.gemini_service import generate_interview_questions, generate_speech_continuation, evaluate_interview_answers,  generate_stress_management_plan


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

@router.post("/generate-stress-management-plan")
async def generate_stress_plan(request: StressSummaryRequest):
    """Generate a stress management plan from a stress metrics summary"""
    try:
        result = generate_stress_management_plan(request.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        print(f"LLM service error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class QuestionAnswer(BaseModel):
    question: str
    sample_answer: str
    user_answer: str


class EvaluationRequest(BaseModel):
    questions_with_answers: list[QuestionAnswer]


@router.post("/evaluate-answers")
async def evaluate_answers(request: EvaluationRequest):
    """
    Evaluate user answers against expected sample answers.
    
    Returns overall score (0-5) and per-question matching details.
    """
    try:
        # Convert Pydantic models to dicts
        qa_list = [qa.model_dump() for qa in request.questions_with_answers]
        result = evaluate_interview_answers(qa_list)
        return result
    except Exception as e:
        print(f"LLM service error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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
        print(f"LLM service error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
