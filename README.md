# AI Counsellor 🎓

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg)](https://fastapi.tiangolo.com/)

> A stage-based decision system for study-abroad guidance. Not a chatbot — a decision engine.

## The Problem

Students applying abroad face **decision paralysis**. Hundreds of universities, conflicting advice, no clear path forward. They waste months researching schools that don't fit their profile.

## The Solution

AI Counsellor enforces a **4-stage journey** that forces clarity:

```
ONBOARDING → DISCOVERY → LOCKED → APPLICATION
```

- **ONBOARDING**: Build your academic profile (GPA, budget, goals, test scores)
- **DISCOVERY**: AI recommends universities with honest risk assessments (Dream/Target/Safe)
- **LOCKED**: Commit to your choices — no more endless browsing
- **APPLICATION**: Get auto-generated tasks and actionable guidance

## Key Features

| Feature | Description |
|---------|-------------|
| **Stage Enforcement** | Can't skip ahead. System forces you through each step. |
| **AI Actions, Not Chat** | AI executes database operations (shortlist, lock, create tasks) |
| **Risk Assessment** | Universities categorized as DREAM, TARGET, or SAFE based on your profile |
| **Lock Commitment** | Once locked, you're committed. No more decision paralysis. |
| **Auto-Generated Tasks** | Locking triggers personalized application tasks |

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS
- **Backend**: FastAPI (Python 3.11)
- **Database**: PostgreSQL
- **AI**: Google Gemini API with function calling

## Quick Start

### Option 1: Run on Replit (Recommended)

[![Run on Replit](https://replit.com/badge/github/yourusername/ai-counsellor)](https://replit.com)

### Option 2: Docker Compose

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-counsellor.git
cd ai-counsellor

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d

# Access the app
open http://localhost:5000
```

### Option 3: Manual Setup

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

## Demo Credentials

| Profile | Email | Password | GPA | Budget |
|---------|-------|----------|-----|--------|
| Weak | `weak@demo.com` | `Demo@123` | 2.8 | $25k |
| Average | `average@demo.com` | `Demo@123` | 3.4 | $45k |
| Strong | `strong@demo.com` | `Demo@123` | 3.9 | $70k |

## Project Structure

```
ai-counsellor/
├── backend/
│   ├── main.py              # FastAPI application & routes
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # JWT authentication
│   ├── database.py          # PostgreSQL connection
│   ├── ai_counsellor.py     # Gemini AI integration
│   ├── demo_data.py         # Demo user profiles
│   └── universities_data.py # Seed data
├── frontend/
│   └── src/
│       ├── app/             # Next.js app router
│       ├── components/      # React components
│       └── lib/             # API client & store
├── docker-compose.yml       # Docker orchestration
├── .github/workflows/       # CI/CD pipeline
└── README.md
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | JWT signing secret | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/user/me` | Get current user |
| GET | `/api/profile` | Get user profile |
| POST | `/api/profile` | Update profile |
| GET | `/api/universities` | List all universities |
| GET | `/api/shortlist` | Get shortlisted universities |
| POST | `/api/shortlist/{id}` | Add to shortlist |
| POST | `/api/lock/{id}` | Lock a university |
| GET | `/api/tasks` | Get user tasks |
| POST | `/api/counsellor/chat` | Chat with AI counsellor |

## How the AI Works

The AI Counsellor uses **Gemini function calling** to execute actions:

```python
# AI receives user message
"Lock University of Toronto for my application"

# AI responds with tool call
{
  "function": "lock_university",
  "arguments": {"university_id": 7}
}

# Backend validates and executes
# Returns confirmation to user
```

Every action updates the database. No fake responses.

## Stage Rules

| Stage | Can Do | Cannot Do |
|-------|--------|-----------|
| ONBOARDING | Complete profile | Access universities |
| DISCOVERY | Shortlist, view recommendations | Lock, see tasks |
| LOCKED | Lock universities, view tasks | Change profile |
| APPLICATION | Complete tasks, get guidance | Unlock universities |

## CI/CD Pipeline

This project includes a GitHub Actions pipeline that runs on every push and PR:

```
Backend CI → Frontend CI → Docker Build → Deploy
   (lint)      (lint)       (images)     (main only)
      │          │             │
      └────────────────────────┴─── All run in parallel
```

**Pipeline Features:**
- Python linting with Ruff
- TypeScript type checking
- Production build verification
- Docker image build testing
- Automatic deploy trigger on main

See [docs/CICD.md](docs/CICD.md) for detailed pipeline documentation.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built for [Hackathon Name] 2026
