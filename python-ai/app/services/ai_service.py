from groq import Groq
from app.models.schemas import (
    GenerateQuestionsRequest, GenerateQuestionsResponse, Question,
    EvaluateAnswerRequest, EvaluateAnswerResponse,
    ParseResumeRequest, ParseResumeResponse,
    InterviewSummaryRequest, InterviewSummaryResponse
)
from typing import List
import json
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Groq free model — fast LLaMA 3.1 70B
MODEL = "openai/gpt-oss-120b"

EXPERIENCE_CONTEXT = {
    "FRESHER": "0-1 year, focus on fundamentals, basic concepts, simple coding",
    "JUNIOR": "1-2 years, working knowledge, guided projects",
    "MID": "2-4 years, independent work, system design basics",
    "SENIOR": "4+ years, architecture, leadership, advanced concepts"
}

def _chat(prompt: str, temperature: float = 0.7) -> dict:
    """Call Groq and parse JSON from response."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are an expert technical interviewer. Always respond with valid JSON only. No markdown, no explanation — pure JSON."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=temperature,
        max_tokens=2048,
    )
    content = response.choices[0].message.content.strip()
    # Strip markdown code blocks if model wraps in them
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content)


def generate_questions(req: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    tech_list = ", ".join(req.technologies)
    exp_context = EXPERIENCE_CONTEXT.get(req.experience_level, "mid-level")
    resume_section = f"\n\nCandidate Resume:\n{req.resume_text}" if req.resume_text else ""

    round_focus = {
        1: "fundamentals, basic concepts, and theoretical knowledge",
        2: "advanced topics, problem-solving, and practical implementation",
        3: "system design, behavioral questions, and leadership"
    }.get(req.round_number, "mixed topics")

    count = 10 if req.round_number == 3 else 12

    prompt = f"""Generate {count} interview questions for a {req.experience_level} candidate ({exp_context}).

Technologies: {tech_list}
Interview Type: {req.interview_type}
Round: {req.round_number} - Focus on {round_focus}
{resume_section}

Rules:
- Mix difficulty: 40% easy, 40% medium, 20% hard
- For TECHNICAL type: 80% technical, 20% behavioral
- For HR type: 20% technical, 80% behavioral
- For MIXED: 50% technical, 50% behavioral
- Make questions specific to the selected technologies
- If resume provided, include 3-4 questions based on their projects/experience
- Questions should be progressively challenging

Return ONLY this JSON (no markdown):
{{
  "questions": [
    {{
      "order": 1,
      "text": "question text here",
      "category": "technical",
      "difficulty": "easy",
      "expected_keywords": ["keyword1", "keyword2"]
    }}
  ]
}}"""

    data = _chat(prompt, temperature=0.7)
    questions = [Question(**q) for q in data["questions"]]
    return GenerateQuestionsResponse(interview_id=req.interview_id, questions=questions)


def evaluate_answer(req: EvaluateAnswerRequest) -> EvaluateAnswerResponse:
    keywords_str = ", ".join(req.expected_keywords)

    prompt = f"""Evaluate this interview answer.

Question: {req.question}
Candidate's Answer: {req.answer}
Technology: {req.technology}
Experience Level: {req.experience_level}
Expected Keywords/Concepts: {keywords_str}

Return ONLY this JSON (no markdown):
{{
  "score": 7,
  "feedback": "2-3 sentence constructive feedback here",
  "strengths": ["what they did well"],
  "improvements": ["what could be better"],
  "keywords_matched": ["keywords candidate mentioned"]
}}

Scoring guide:
- 0-3: Incorrect or very incomplete
- 4-5: Partially correct, missing key concepts
- 6-7: Good answer, minor gaps
- 8-9: Strong answer, well explained
- 10: Excellent, comprehensive answer"""

    data = _chat(prompt, temperature=0.3)
    return EvaluateAnswerResponse(**data)


def parse_resume(req: ParseResumeRequest) -> ParseResumeResponse:
    prompt = f"""Extract structured information from this resume text.

Resume:
{req.resume_text[:3000]}

Return ONLY this JSON (no markdown):
{{
  "name": "candidate name or null",
  "skills": ["skill1", "skill2"],
  "experience_years": 2,
  "projects": ["project description"],
  "summary": "2-3 sentence professional summary"
}}

Focus on: programming languages, frameworks, tools, databases, cloud platforms."""

    data = _chat(prompt, temperature=0.1)
    return ParseResumeResponse(**data)


def generate_summary(req: InterviewSummaryRequest) -> InterviewSummaryResponse:
    qa_pairs = "\n".join([
        f"Q{i+1}: {q}\nA{i+1}: {a}\nScore: {s}/10"
        for i, (q, a, s) in enumerate(zip(req.questions, req.answers, req.scores))
    ])
    avg_score = sum(req.scores) / len(req.scores) if req.scores else 0
    passed = avg_score >= 6.0

    prompt = f"""Evaluate this mock interview performance and generate a report.

Technologies: {', '.join(req.technologies)}
Experience Level: {req.experience_level}
Average Score: {avg_score:.1f}/10
Passed: {passed}

Interview Q&A:
{qa_pairs}

Return ONLY this JSON (no markdown):
{{
  "overall_score": {avg_score:.1f},
  "passed": {"true" if passed else "false"},
  "technical_feedback": "detailed 3-4 sentence technical assessment",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["area1", "area2", "area3"],
  "recommendation": "actionable 2-3 sentence career recommendation"
}}"""

    data = _chat(prompt, temperature=0.4)
    data["overall_score"] = avg_score
    data["passed"] = passed
    return InterviewSummaryResponse(**data)
