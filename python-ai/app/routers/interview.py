from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    GenerateQuestionsRequest, GenerateQuestionsResponse,
    EvaluateAnswerRequest, EvaluateAnswerResponse,
    InterviewSummaryRequest, InterviewSummaryResponse
)
from app.services import ai_service

router = APIRouter()

@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
def generate_questions(req: GenerateQuestionsRequest):
    try:
        return ai_service.generate_questions(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
def evaluate_answer(req: EvaluateAnswerRequest):
    try:
        return ai_service.evaluate_answer(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interview-summary", response_model=InterviewSummaryResponse)
def interview_summary(req: InterviewSummaryRequest):
    try:
        return ai_service.generate_summary(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
