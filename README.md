# 🎯 MockMate — AI-Powered Mock Interview Platform

> Java Spring Boot + Python FastAPI + React Vite + OpenAI GPT-4o

## 🏗️ Architecture

```
Frontend (React + Vite)  →  Java Backend (Spring Boot)  →  Python AI Service (FastAPI)
                                     ↕                              ↕
                              PostgreSQL (Neon.tech)         OpenAI GPT-4o
```

## ✨ Features

- **Resume Upload** — PDF/DOCX resume parsed by AI for personalized questions
- **Technology Selection** — Choose from 20+ technologies (Java, Spring Boot, React, AWS, etc.)
- **Experience Level** — Fresher / Junior / Mid / Senior
- **Interview Types** — Technical / HR / Mixed
- **AI Interview** — GPT-4o generates and evaluates questions
- **Live Scoring** — Real-time answer evaluation with feedback
- **Round Progression** — 3 rounds, auto-schedule if score ≥ 6/10
- **Email Notifications** — Interview link + results via email

## 📁 Project Structure

```
mockmate/
├── frontend/          ← React + Vite + Tailwind
├── java-backend/      ← Spring Boot (Auth, Interview, Resume)
└── python-ai/         ← FastAPI (AI question gen, evaluation)
```

## 🚀 Quick Start

### 1. Python AI Service

```bash
cd python-ai
cp .env.example .env
# Add OPENAI_API_KEY in .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Java Backend

```bash
cd java-backend
cp .env.example .env
# Fill in all values in .env
# Set environment variables OR add to application.yml

# Run
./mvnw spring-boot:run
# OR
mvn spring-boot:run
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:8080/api
npm install
npm run dev
```

## 🔧 Environment Variables

### Java Backend
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL JDBC URL (Neon.tech) |
| `DB_USERNAME` | DB username |
| `DB_PASSWORD` | DB password |
| `JWT_SECRET` | Secret key (min 32 chars) |
| `MAIL_USERNAME` | Gmail address |
| `MAIL_PASSWORD` | Gmail App Password |
| `AI_SERVICE_URL` | Python service URL (default: http://localhost:8000) |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs |
| `FRONTEND_URL` | Frontend URL for email links |

### Python AI Service
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Java backend URL + /api |

## 🗄️ Database

Auto-creates tables on first run (`ddl-auto: update`).

Tables: `users`, `resumes`, `interviews`, `questions`, `scores`

## 📧 Gmail Setup (for email notifications)

1. Enable 2-Factor Auth on Gmail
2. Go to Google Account → Security → App Passwords
3. Create App Password for "Mail"
4. Use that 16-char password as `MAIL_PASSWORD`

## 🌐 Deployment

### Frontend → Vercel
- Root: `frontend`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://your-java-backend.onrender.com/api`

### Java Backend → Render (Docker)
- Root: `java-backend`
- Language: Docker
- Add all env vars in Render dashboard

### Python AI → Render (Docker)
- Root: `python-ai`
- Language: Docker
- Add `OPENAI_API_KEY`

## 🎯 Interview Flow

1. User registers/logs in
2. Uploads resume (optional)
3. Selects: experience level + interview type + technologies
4. Clicks "Start Interview" → Java creates interview, calls Python AI
5. Python AI generates 10-12 questions via GPT-4o
6. Interview link emailed + redirect to interview page
7. User answers each question
8. Each answer evaluated in real-time by GPT-4o (score + feedback)
9. After all answers → "Finish Interview"
10. Java calls Python AI for overall summary
11. Results page shows: score, strengths, improvements, recommendation
12. Score ≥ 6: passed; result email sent; Round 2 button shown
