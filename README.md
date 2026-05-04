# Aura

Most people lose interviews because they never actually practice talking out loud.

Aura fixes that. It reads your resume, understands the job you want, and runs a real voice interview with you. You speak. It listens, transcribes, scores, and tells you exactly where you fell short and why.

---

## The problem it solves

Reading interview tips does nothing. Aura puts you in the seat, asks the hard questions, and makes you answer them out loud before the real thing happens.

---

## Core features

**Voice Mock Interviews**
Speak your answers out loud. Real-time transcription captures everything you say. AI scores you on clarity, depth, and confidence after every single answer.

**Resume Grill**
Upload your resume and get interrogated on it. Every project, every skill, every line. If you put it on your resume, you better be able to defend it.

**Company Prep**
Tell Aura which company you are interviewing at. It builds questions around that company's culture, values, and known interview style so you walk in prepared for that specific room.

**STAR Method Coaching**
Behavioral questions trip most people up. Aura coaches you through the Situation Task Action Result framework and tells you where your answer broke down.

**AI Scoring**
Every answer gets a score. You see your strengths, your gaps, and specific ways to improve. Not vague feedback. Actual notes on what you said and what you should have said instead.

**Progress Tracking**
Your scores are tracked across every session. You can see yourself getting better over time or see exactly where you keep dropping the ball.

---

## Stack

**Frontend**
- Next.js 15 (App Router, Server Components, streaming)
- TypeScript (strict mode)
- Tailwind CSS v4
- Framer Motion (animations)
- Clerk (authentication)
- Remotion (video composition)
- Socket.IO client (real-time interview session)

**Backend**
- Python 3.11
- FastAPI (async, high performance REST + WebSocket)
- Socket.IO (real-time bidirectional interview communication)
- SQLAlchemy 2.0 (async ORM)
- Alembic (database migrations)
- Slowapi (rate limiting)
- Uvicorn (ASGI server)

**Database and Storage**
- PostgreSQL (Supabase managed, pgbouncer connection pooling)
- Supabase Storage (resume PDF uploads, public bucket)
- Redis via Upstash (session management, rate limit state, TLS)

**AI and Voice**
- Google Gemini 1.5 (resume parsing, question generation, answer evaluation)
- Groq Whisper (speech to text, real-time transcription)
- ElevenLabs (text to speech, natural AI voice output)
- OpenAI TTS (fallback voice generation)

**Payments and Auth**
- Stripe (subscription billing, webhook verification)
- Clerk (JWT authentication, user management)
- Svix (webhook security)
