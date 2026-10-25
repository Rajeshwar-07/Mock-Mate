from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import ParseResumeResponse, ParseResumeRequest
from app.services.resume_parser import extract_text_from_file
from app.services import ai_service

router = APIRouter()

@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(file: UploadFile = File(...)):
    allowed = {".pdf", ".docx", ".doc", ".txt"}
    ext = "." + file.filename.split(".")[-1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported. Use PDF, DOCX, or TXT.")

    text = await extract_text_from_file(file)
    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract text from resume. Please check the file.")

    result = ai_service.parse_resume(ParseResumeRequest(resume_text=text))
    return result

@router.post("/extract-resume-text")
async def extract_resume_text(file: UploadFile = File(...)):
    """Extract raw text from resume — used by Java backend to store resume text"""
    text = await extract_text_from_file(file)
    return {"text": text, "char_count": len(text)}
