# CI/CD Pipeline Documentation

## Overview

This project uses **GitHub Actions** for continuous integration and continuous deployment. The pipeline runs automatically on every push and pull request to ensure code quality and build stability.

## Pipeline Triggers

| Event | Branches | What Runs |
|-------|----------|-----------|
| Push | `main`, `develop` | Full pipeline + Deploy step |
| Pull Request | `main` | Full pipeline (no deploy) |

## Pipeline Jobs

### 1. Backend CI (`backend`)

Validates the Python FastAPI backend.

**Steps:**
1. **Checkout** - Pulls latest code
2. **Setup Python 3.11** - Configures Python environment with pip caching
3. **Start PostgreSQL** - Spins up test database service
4. **Install Dependencies** - Installs from `requirements.txt` + testing tools
5. **Lint with Ruff** - Checks code style and common errors
6. **Syntax Check** - Validates Python files compile correctly

**Test Database:**
- PostgreSQL 15 runs as a service container
- Connection: `postgresql://test:test@localhost:5432/test_db`

### 2. Frontend CI (`frontend`)

Validates the Next.js frontend.

**Steps:**
1. **Checkout** - Pulls latest code
2. **Setup Node.js 20** - Configures Node with npm caching
3. **Install Dependencies** - Runs `npm ci` for deterministic installs
4. **Lint** - Runs ESLint on all files
5. **Type Check** - Runs TypeScript compiler in check mode
6. **Build** - Creates production build to verify no build errors

### 3. Docker Build (`docker`)

Tests that Docker images build successfully.

**Depends on:** Backend CI, Frontend CI (must pass first)

**Steps:**
1. **Setup Docker Buildx** - Enables advanced build features
2. **Build Backend Image** - Builds `ai-counsellor-backend:test`
3. **Build Frontend Image** - Builds `ai-counsellor-frontend:test`

**Caching:** Uses GitHub Actions cache for faster builds.

### 4. Deploy (`deploy`)

Runs only on `main` branch after all other jobs pass.

**Current Status:** Notification only (ready for configuration)

**Supported Platforms:**
- Replit Deployments
- Railway
- Fly.io
- AWS/GCP/Azure

## Pipeline Flow

```
┌─────────────┐     ┌─────────────┐
│  Backend CI │     │ Frontend CI │
│   (Python)  │     │  (Next.js)  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
         ┌───────▼───────┐
         │  Docker Build │
         │   (Images)    │
         └───────┬───────┘
                 │
         ┌───────▼───────┐
         │    Deploy     │
         │ (main only)   │
         └───────────────┘
```

## Required Secrets

Configure these in **GitHub Repository Settings → Secrets and Variables → Actions**:

| Secret | Required | Description |
|--------|----------|-------------|
| `GEMINI_API_KEY` | Optional | For AI integration tests |

## Adding Tests

### Backend Tests (pytest)

Create test files in `backend/tests/`:

```python
# backend/tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

Run locally:
```bash
cd backend
pip install pytest httpx
pytest -v
```

### Frontend Tests (Jest)

Add to `frontend/package.json`:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

Create test files in `frontend/__tests__/`:
```typescript
// frontend/__tests__/components.test.tsx
import { render, screen } from '@testing-library/react'

test('renders component', () => {
  // test code
})
```

## Extending the Pipeline

### Add Code Coverage

```yaml
- name: Run tests with coverage
  run: pytest --cov=. --cov-report=xml

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

### Add Security Scanning

```yaml
- name: Security scan
  uses: pyupio/safety@v2
  with:
    api-key: ${{ secrets.SAFETY_API_KEY }}
```

### Add E2E Tests

```yaml
e2e:
  runs-on: ubuntu-latest
  needs: [backend, frontend]
  steps:
    - uses: actions/checkout@v4
    - name: Start services
      run: docker-compose up -d
    - name: Run Playwright tests
      run: npx playwright test
```

## Local Validation

Before pushing, validate locally:

```bash
# Backend
cd backend
ruff check .
python -m py_compile main.py

# Frontend
cd frontend
npm run lint
npx tsc --noEmit
npm run build

# Docker
docker-compose build
```

## Troubleshooting

### Pipeline Fails on Lint

Check Ruff output for specific errors:
```bash
cd backend
ruff check . --show-source
```

### TypeScript Errors

Run type check locally to see full output:
```bash
cd frontend
npx tsc --noEmit
```

### Docker Build Fails

Test build locally:
```bash
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
```

## Status Badges

Add to README:
```markdown
[![CI](https://github.com/yourusername/ai-counsellor/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/ai-counsellor/actions/workflows/ci.yml)
```
