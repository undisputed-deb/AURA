# Aura

AI-powered voice interview coach. Upload your resume, pick a role, and get grilled by an AI that actually knows what it's doing.

---

## What it does

**Mock Interviews** — Generates questions from your resume and the job description. You answer out loud, it transcribes and scores you.

**Resume Grill** — Reads everything on your resume and interrogates you on it. Every project, every skill, every claim.

**Company Prep** — Questions built around the culture and interview style of the specific company you are targeting.

**STAR Method Coaching** — Structured feedback on behavioral answers using the Situation Task Action Result framework.

**Voice Interaction** — ElevenLabs reads questions aloud. Groq Whisper transcribes your answers in real time.

**AI Scoring** — Gemini evaluates every answer on clarity, depth, and confidence. Gives you a score, strengths, and gaps.

**Progress Tracking** — Dashboard showing your improvement across sessions.

---

## Stack

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
- Redis via Upstash
- Clerk (auth verification)

**AI / Voice**
- Google Gemini - resume parsing, question generation, answer evaluation
- Groq Whisper - speech to text
- ElevenLabs - voice output
- OpenAI TTS - fallback voice

**Storage**
- Supabase Storage for resume PDFs

---

## Running locally

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

## Deployment

- Frontend on Vercel, connect the `frontend/` folder
- Backend on Render, Python detected automatically via `Procfile`
- Set all env vars on both platforms
- Point `NEXT_PUBLIC_API_URL` to your Render backend URL
- Clerk production instance requires a custom domain

---

## Pricing model

Free tier gets 2 lifetime interviews, up to 5 questions each. Pro unlocks unlimited interviews, up to 15 questions, Resume Grill, Company Prep, and ideal answer examples. Payments via Stripe.

---

## License

MIT
