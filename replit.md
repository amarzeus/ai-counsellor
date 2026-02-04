# AI Counsellor

## Overview

AI Counsellor is a stage-based decision system for study-abroad guidance. Unlike traditional chatbots, it functions as a decision engine that enforces a structured 4-stage journey (Onboarding → Discovery → Locked → Application) to help students overcome decision paralysis when applying to universities abroad.

The system provides:
- AI-powered university recommendations with risk categorization (Dream/Target/Safe)
- Profile-based eligibility filtering using real, verified university data
- Stage-gated access control to enforce commitment before application guidance
- Voice chat capabilities with text-to-speech responses

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom design system tokens
- **State Management**: Zustand for global state (auth, comparison lists)
- **UI Components**: shadcn/ui with Radix primitives
- **Theme**: Dark/light mode via next-themes
- **Deployment**: Vercel (standalone output mode)

**Key Design Decisions**:
- API calls proxied through Next.js rewrites to backend (`/api/:path*` → backend)
- Component-based architecture with separation between UI primitives and feature components
- Design system documented in `src/design_system.md` for consistent styling

### Backend Architecture
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (production) / SQLite (local development)
- **ORM**: SQLAlchemy with declarative models
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI Integration**: Google Gemini API with key rotation support

**Key Design Decisions**:
- Stage-based access control enforced at API level (`require_stage_minimum` guards)
- Real university data stored in `real_universities_data.py` as source of truth - AI cannot hallucinate facts
- Recommendation engine uses intent detection + eligibility filtering before AI response
- Voice features use edge-tts for text-to-speech synthesis

### Database Schema
Core models:
- `User` - Authentication and stage tracking
- `UserProfile` - Academic profile, budget, preferences
- `University` / `Program` - Verified university and program data
- `ShortlistedUniversity` - User's selected universities with categories
- `Task` - Application checklist items
- `ChatSession` / `ChatMessage` - Conversation history with structured metadata

### Authentication Flow
1. Email/password signup with bcrypt hashing
2. JWT tokens with 7-day expiration
3. Optional Google OAuth integration
4. Password reset via email tokens

## External Dependencies

### AI Services
- **Google Gemini API**: Primary AI for counseling responses, intent detection, SOP analysis
  - Supports multiple API keys via `GEMINI_API_KEYS` (comma-separated)
  - Replit AI integration supported via `AI_INTEGRATIONS_GEMINI_*` env vars

### Database
- **PostgreSQL**: Production database (Render)
- **SQLite**: Local development fallback

### Email
- **SMTP**: Password reset emails via configurable SMTP (Gmail compatible)
  - Env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

### OAuth
- **Google OAuth**: Optional social login
  - Env vars: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`

### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **CI/CD**: GitHub Actions for linting, type checking, and build validation

### Voice Features
- **edge-tts**: Microsoft Edge TTS for voice responses (no API key required)