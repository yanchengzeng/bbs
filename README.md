# BBS - Text Social Platform

A text-only social platform for sharing daily activities and thoughts with friends. Built with React + Vite frontend and FastAPI backend.

## Features

- 📝 Text posts grouped by date
- 💬 Comments on posts (no nested comments)
- ❤️ Like/reaction system
- 👤 User profiles with posts
- 🔍 Search posts and users
- 🔐 Google OAuth authentication
- ✏️ Edit and delete your own posts/comments
- 📱 Responsive design with dark mode support
- 📄 Markdown support for post content

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- Alembic (migrations)
- JWT authentication
- Google OAuth

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Tailwind CSS
- react-markdown

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- SQLite (default for local development; no extra install)
- PostgreSQL (optional for production)
- Google OAuth credentials (optional; app supports anonymous posting without login)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (copy from `env.example`):
```bash
cp env.example .env
```

5. Update `.env` with your configuration:
- For **SQLite local dev**: leave `DATABASE_URL` unset (default is `sqlite:///./bbs.db`)
- For **PostgreSQL**: set `DATABASE_URL=postgresql://...` and also install:
  - `pip install -r requirements-postgres.txt`
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google Cloud Console
- Set `GOOGLE_REDIRECT_URI` to `http://localhost:8000/auth/google/callback`
- Generate a secure `SECRET_KEY` for JWT tokens
- Set `FRONTEND_URL` to `http://localhost:5173`

6. Initialize the database:
```bash
alembic upgrade head
```

This will create `backend/bbs.db` when using SQLite.

7. Run the backend server:
```bash
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `env.example`):
```bash
cp env.example .env
```

4. Update `.env` with:
```
VITE_API_URL=http://localhost:8000
```

5. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
6. Copy the Client ID and Client Secret to your backend `.env` file

## Development

### Backend API Documentation

Once the backend is running, visit:
- API docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Fake data (optional)

To generate sample posts/tags (for weekly summary/testing), run:

```bash
cd backend
python inject_fake_data.py
```

### Database Migrations

To create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

Backend:
```bash
cd backend
# Production server setup with gunicorn or similar
```

## Deployment

This application is configured for deployment to:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Render PostgreSQL

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions, including:
- Step-by-step setup for Vercel and Render
- Environment variable configuration
- Google OAuth production setup
- Troubleshooting guide

## Project Structure

```
bbs/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth middleware
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database setup
│   │   └── main.py          # FastAPI app
│   ├── alembic/            # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   └── utils/          # Utility functions
│   └── package.json
└── README.md
```

## License

MIT License
