from pydantic import BaseModel
from typing import List, Optional

class GenerateQuestionsRequest(BaseModel):
    interview_id: str
    technologies: List[str]          # ["java", "spring_boot", "react"]
    experience_level: str            # FRESHER / JUNIOR / MID / SENIOR
    interview_type: str              # TECHNICAL / HR / MIXED
    round_number: int                # 1, 2, 3
    resume_text: Optional[str] = None

class Question(BaseModel):
    order: int
    text: str
    category: str                    # technical / hr / behavioral
    difficulty: str                  # easy / medium / hard
    expected_keywords: List[str]

class GenerateQuestionsResponse(BaseModel):
    interview_id: str
    questions: List[Question]

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    technology: str
    experience_level: str
    expected_keywords: List[str]

class EvaluateAnswerResponse(BaseModel):
    score: int                       # 0-10
    feedback: str
    strengths: List[str]
    improvements: List[str]
    keywords_matched: List[str]

class ParseResumeRequest(BaseModel):
    resume_text: str

class ParseResumeResponse(BaseModel):
    name: Optional[str]
    skills: List[str]
    experience_years: Optional[float]
    projects: List[str]
    summary: str

class InterviewSummaryRequest(BaseModel):
    interview_id: str
    questions: List[str]
    answers: List[str]
    scores: List[int]
    technologies: List[str]
    experience_level: str

class InterviewSummaryResponse(BaseModel):
    overall_score: float
    passed: bool
    technical_feedback: str
    strengths: List[str]
    improvements: List[str]
    recommendation: str
