import PyPDF2
import docx
import io
from fastapi import UploadFile

async def extract_text_from_file(file: UploadFile) -> str:
    """Extract text from PDF or DOCX resume file"""
    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        return extract_from_pdf(content)
    elif filename.endswith(".docx"):
        return extract_from_docx(content)
    elif filename.endswith(".doc"):
        # Treat as plain text fallback
        return content.decode("utf-8", errors="ignore")
    else:
        return content.decode("utf-8", errors="ignore")


def extract_from_pdf(content: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(content))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()


def extract_from_docx(content: bytes) -> str:
    doc = docx.Document(io.BytesIO(content))
    text = "\n".join([para.text for para in doc.paragraphs])
    return text.strip()
