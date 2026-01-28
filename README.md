# AI Counsellor

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688.svg)](https://fastapi.tiangolo.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4.svg)](https://ai.google.dev/)

**A stage-based decision system for study-abroad guidance. Not a chatbot — a decision engine.**

[Live Demo](https://ai-counsellor.vercel.app) | [Documentation](docs/CICD.md) | [Report Bug](https://github.com/amarzeus/ai-counsellor/issues)

---

## The Problem

Students applying abroad face **decision paralysis**:
- Hundreds of universities to choose from
- No clear guidance on what's realistic
- Months wasted on schools that don't fit their profile
- Endless browsing without commitment

## The Solution

AI Counsellor enforces a **4-stage journey** that forces clarity:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  ONBOARDING  │───▶│  DISCOVERY   │───▶│    LOCKED    │───▶│ APPLICATION  │
│              │    │              │    │              │    │              │
│ Build your   │    │ AI recommends│    │ Commit to    │    │ Get tasks &  │
│ profile      │    │ with risk    │    │ your choices │    │ guidance     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

**You cannot skip stages. The system enforces the journey.**

---

## Key Features

| Feature | What It Does |
|---------|--------------|
| **Stage Enforcement** | Can't skip ahead. System forces you through each step. |
| **AI Actions, Not Chat** | AI executes real database operations (shortlist, lock, create tasks) |
| **Risk Assessment** | Universities categorized as DREAM, TARGET, or SAFE based on your profile |
| **Lock Commitment** | Once locked, you're committed. No more decision paralysis. |
| **Auto-Generated Tasks** | Locking triggers personalized application tasks |

---

## How It Works

### 1. Onboarding
Complete your academic profile: GPA, budget, goals, test scores.

### 2. Discovery
AI analyzes your profile and recommends universities with honest assessments:
- **DREAM** - Ambitious reach (low probability)
- **TARGET** - Good fit (realistic match)
- **SAFE** - Strong chance of admission

### 3. Locking
Choose universities and **lock** them. This is a commitment point — no more endless browsing.

### 4. Application
System generates personalized tasks: deadlines, document requirements, SOP guidance.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router) + Tailwind CSS |
| **Backend** | FastAPI (Python 3.11) |
| **Database** | PostgreSQL |
| **AI** | Google Gemini API with function calling |
| **Deployment** | Vercel (frontend) + Replit/Railway (backend) |

---

## Quick Start

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/amarzeus/ai-counsellor&env=NEXT_PUBLIC_API_URL&envDescription=Backend%20API%20URL)

### Option 2: Run on Replit

[![Run on Replit](https://replit.com/badge/github/amarzeus/ai-counsellor)](https://replit.com/@amarzeus/ai-counsellor)

### Option 3: Docker Compose (Local)

```bash
git clone https://github.com/amarzeus/ai-counsellor.git
cd ai-counsellor

cp .env.example .env
# Edit .env with your GEMINI_API_KEY

docker-compose up -d
open http://localhost:5000
```

### Option 4: Manual Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Demo Credentials

Try the app with pre-configured profiles:

| Profile | Email | Password | GPA | Budget | AI Behavior |
|---------|-------|----------|-----|--------|-------------|
| **Weak** | `weak@demo.com` | `Demo@123` | 2.8 | $25k | Most unis = DREAM |
| **Average** | `average@demo.com` | `Demo@123` | 3.4 | $45k | Mix of TARGET + SAFE |
| **Strong** | `strong@demo.com` | `Demo@123` | 3.9 | $70k | Top schools reachable |

---

## Project Structure

```
ai-counsellor/
├── backend/
│   ├── main.py              # FastAPI application & routes
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic validation schemas
│   ├── auth.py              # JWT authentication
│   ├── database.py          # PostgreSQL connection
│   ├── ai_counsellor.py     # Gemini AI integration
│   ├── demo_data.py         # Demo user profiles
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/app/             # Next.js app router pages
│   ├── src/components/      # React components
│   ├── src/lib/             # API client & store
│   └── package.json         # Node dependencies
├── docs/
│   └── CICD.md              # CI/CD pipeline documentation
├── .github/workflows/       # GitHub Actions CI/CD
├── docker-compose.yml       # Local development setup
└── vercel.json              # Vercel deployment config
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | JWT signing secret | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL (for frontend) | Yes |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Login and get JWT |
| `GET` | `/api/user/me` | Get current user |
| `GET` | `/api/profile` | Get user profile |
| `POST` | `/api/profile` | Update profile |
| `GET` | `/api/universities` | List all universities |
| `GET` | `/api/shortlist` | Get shortlisted universities |
| `POST` | `/api/shortlist/{id}` | Add to shortlist |
| `POST` | `/api/lock/{id}` | Lock a university |
| `GET` | `/api/tasks` | Get user tasks |
| `POST` | `/api/counsellor/chat` | Chat with AI counsellor |
| `GET` | `/health` | Health check |

---

## How the AI Works

The AI Counsellor uses **Gemini function calling** to execute real actions:

```
User: "Lock University of Toronto for my application"
                    │
                    ▼
┌─────────────────────────────────────────┐
│           Gemini AI Processes           │
│                                         │
│  1. Understands user intent             │
│  2. Validates user can lock (stage)     │
│  3. Calls lock_university tool          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Backend Executes                │
│                                         │
│  1. Validates university exists         │
│  2. Updates database                    │
│  3. Creates application tasks           │
│  4. Returns confirmation                │
└─────────────────────────────────────────┘
```

**Every AI action updates the database. No fake responses.**

---

## Stage Rules

| Stage | Can Do | Cannot Do |
|-------|--------|-----------|
| ONBOARDING | Complete profile | Access universities |
| DISCOVERY | Shortlist, view recommendations | Lock, see tasks |
| LOCKED | Lock universities | Change profile |
| APPLICATION | Complete tasks, get guidance | Unlock universities |

---

## CI/CD Pipeline

Automated testing and deployment on every push:

```
Backend CI ──┬──▶ Docker Build ──▶ Deploy
             │
Frontend CI ─┘
```

See [docs/CICD.md](docs/CICD.md) for detailed pipeline documentation.

---

## Deployment

### Frontend (Vercel)
1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url.com`
4. Deploy

### Backend (Railway/Render/Replit)
1. Create new project
2. Connect GitHub repo
3. Set root directory to `backend`
4. Add environment variables: `DATABASE_URL`, `SESSION_SECRET`, `GEMINI_API_KEY`
5. Deploy

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built with [Gemini AI](https://ai.google.dev/) for intelligent decision-making
- Powered by [FastAPI](https://fastapi.tiangolo.com/) and [Next.js](https://nextjs.org/)
- Developed on [Replit](https://replit.com/)

---

**Built for the future of education guidance.**
