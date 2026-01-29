# AI Counsellor - Study Abroad Guidance Platform

## Overview
AI Counsellor is a stage-based decision system for study-abroad guidance. It guides students step-by-step from confusion to clarity in their study-abroad journey.

## Tech Stack
- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **AI**: Gemini API (via Replit AI Integrations)

## Project Structure
```
/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── auth.py           # Authentication utilities
│   ├── database.py       # Database connection
│   ├── ai_counsellor.py  # Gemini AI integration
│   └── universities_data.py  # Seed data
├── frontend/
│   └── src/
│       ├── app/          # Next.js app router pages
│       ├── components/   # React components
│       └── lib/          # API client & store
└── replit.md
```

## Core Flow (State Machine)
1. **ONBOARDING** - User completes profile (academic, goals, budget, exams)
2. **DISCOVERY** - AI recommends universities, user shortlists
3. **LOCKED** - User locks at least one university
4. **APPLICATION** - User gets tasks and guidance for applications

## Key Features
- Stage-based navigation (users cannot skip stages)
- AI Counsellor that takes actions (shortlist, lock, create tasks)
- University categorization (Dream, Target, Safe)
- Task management for application preparation

## Running the Project
The project runs two workflows:
1. **Backend**: FastAPI server on port 8000
2. **Frontend**: Next.js dev server on port 5000 (exposed)

## Environment Variables
- DATABASE_URL - PostgreSQL connection
- SESSION_SECRET - JWT secret key
- AI_INTEGRATIONS_GEMINI_API_KEY - Gemini API (auto-configured)
- AI_INTEGRATIONS_GEMINI_BASE_URL - Gemini API URL (auto-configured)
- GOOGLE_OAUTH_CLIENT_ID - Google OAuth client ID
- GOOGLE_OAUTH_CLIENT_SECRET - Google OAuth client secret

## Google OAuth Setup
1. Go to https://console.cloud.google.com/apis/credentials
2. Create/edit OAuth 2.0 Client ID
3. Add redirect URI: `https://<REPLIT_DEV_DOMAIN>/api/auth/google/callback`

## Recent Changes
- Initial setup of full-stack application
- Implemented all 4 stages of the state machine
- Created AI Counsellor with Gemini integration
- Built dashboard, universities, and tasks pages
- Added Google OAuth authentication (Jan 2026)
- Added retry logic for Gemini API rate limits
