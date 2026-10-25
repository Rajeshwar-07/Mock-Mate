from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import interview, resume
import os

app = FastAPI(
    title="MockMate AI Service",
    description="AI microservice for interview question generation and evaluation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router, prefix="/api/ai", tags=["Interview"])
app.include_router(resume.router, prefix="/api/ai", tags=["Resume"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "mockmate-ai"}
