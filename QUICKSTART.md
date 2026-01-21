# Quick Start Guide

## 1. Database Setup

### Option A: SQLite (recommended for local dev)

No setup needed. If you **do not** set `DATABASE_URL`, the backend uses SQLite by default and will create:

- `backend/bbs.db`

### Option B: PostgreSQL (optional)

Create a PostgreSQL database:

```bash
createdb bbs
# Or using psql:
# psql -c "CREATE DATABASE bbs;"
```

## 2. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Only install PostgreSQL dependencies if using PostgreSQL:
# pip install -r requirements-postgres.txt
cp env.example .env
# Edit .env (SQLite works by default; Google OAuth is optional for anonymous posting)
alembic upgrade head
uvicorn app.main:app --reload
```

## 3. Frontend Setup

```bash
cd frontend
npm install
cp env.example .env
# Edit .env with VITE_API_URL=http://localhost:8000
npm run dev
```

## 4. Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:8000/auth/google/callback`
6. Copy Client ID and Secret to backend `.env`

## 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Optional: Inject fake data

```bash
cd backend
python inject_fake_data.py
```

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Ensure database exists

### OAuth Errors
- Verify redirect URI matches exactly
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Ensure Google+ API is enabled

### CORS Errors
- Verify FRONTEND_URL in backend/.env matches frontend URL
- Check VITE_API_URL in frontend/.env
