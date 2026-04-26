# AURA — AI Voice Interview Coach

You practice. You get grilled. You land the role.

Aura is a full-stack AI-powered interview prep platform. Upload your resume, paste a job description, and get a personalized mock interview with real-time voice interaction, instant AI scoring, and brutal resume interrogation mode.

---

## what it does

- **Mock Interviews** — AI generates questions tailored to your resume + the specific job description. You answer out loud, it transcribes and scores you.
- **Resume Grill** — It reads everything on your resume and asks you to defend it. Every project, every skill, every claim.
- **Company Prep** — Questions built around the culture and interview style of the specific company you are targeting.
- **STAR Method Coaching** — Structured feedback on your behavioral answers using the Situation-Task-Action-Result framework.
- **Voice Interaction** — ElevenLabs TTS reads questions aloud. Groq Whisper transcribes your answers in real time.
- **AI Scoring** — Gemini evaluates every answer on clarity, depth, and confidence. Gives you a score, strengths, and specific gaps.
- **Progress Tracking** — Analytics dashboard showing your improvement across sessions.

---

## tech stack

**Frontend**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Clerk (auth)

**Backend**
- Python / FastAPI
- PostgreSQL via Supabase
- SQLAlchemy + Alembic
- Redis (Upstash) for rate limiting and sessions
- Clerk (auth verification)

**AI / Voice**
- Google Gemini — resume parsing, question generation, answer evaluation
- Groq Whisper — speech to text
- OpenAI TTS — text to speech (fallback)
- ElevenLabs — primary voice output

**Storage**
- Supabase Storage (resume PDFs)

---

## running locally

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:socket_app --host 0.0.0.0 --port 8000 --reload
```

Create `backend/.env` from `backend/.env.example` and fill in your keys.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local` with:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## deployment

- **Frontend** → Vercel (connect the `frontend/` folder)
- **Backend** → Render (Python detected automatically via `Procfile`)

Set all env vars in both platforms. Point `NEXT_PUBLIC_API_URL` to your Render backend URL.

---

## pricing model

Free tier gets 2 lifetime interviews, up to 5 questions each. Pro unlocks unlimited interviews, up to 15 questions, Resume Grill, Company Prep, and ideal answer examples. Payments via Stripe.

---

## license

MIT
