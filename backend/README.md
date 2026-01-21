# BBS Backend

FastAPI backend for the BBS text social platform.

## Prerequisites

- Python 3.9 or higher (Python 3.13+ requires Pydantic 2.8.0+)
- PostgreSQL (for production) or SQLite (for local development)

## Setup

### 1. Create Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies

**For SQLite (default, recommended for local development):**
```bash
pip install -r requirements.txt
```

**For PostgreSQL (only if you're using PostgreSQL):**
```bash
pip install -r requirements.txt
pip install -r requirements-postgres.txt
```

**Note:** If you encounter issues installing `psycopg2-binary` on macOS, see the troubleshooting section below or check `requirements-postgres.txt` for installation instructions.

### 3. Configure Environment

Create a `.env` file in the backend directory:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

#### For SQLite (Local Development)

```env
# Leave DATABASE_URL empty or unset to use SQLite (default)
# DATABASE_URL=

# Google OAuth (optional for local dev, but required for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# JWT Secret Key (change in production!)
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
FRONTEND_URL=http://localhost:5173
```

#### For PostgreSQL (Production)

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/bbs

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# JWT Secret Key
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
FRONTEND_URL=http://localhost:5173
```

### 4. Database Setup

#### SQLite (Automatic)

If you don't set `DATABASE_URL`, SQLite will be used automatically. After running migrations, the database file will be created at:

- `backend/bbs.db`

#### PostgreSQL (Manual Setup)

1. Create a PostgreSQL database:
```bash
createdb bbs
# Or using psql:
# psql -c "CREATE DATABASE bbs;"
```

2. Run migrations:
```bash
alembic upgrade head
```

### 5. Run Database Migrations

For both SQLite and PostgreSQL:

```bash
alembic upgrade head
```

To create a new migration:
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Running the Server

### Development Mode

```bash
uvicorn app.main:app --reload
```

The server will start at `http://localhost:8000`

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Note: Use `$PORT` environment variable for platforms like Render that assign ports dynamically.

## Deployment to Render

See the main [DEPLOYMENT.md](../DEPLOYMENT.md) for complete instructions on deploying to Render.

**Quick summary:**
1. Create PostgreSQL database on Render
2. Create Web Service on Render
3. Set environment variables in Render dashboard
4. Configure build/start commands
5. Deploy

**Required Environment Variables for Render:**
- `DATABASE_URL` - Internal PostgreSQL connection string from Render
- `SECRET_KEY` - Strong random string (32+ characters)
- `FRONTEND_URL` - Your Vercel frontend URL
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_REDIRECT_URI` - Must match Render backend URL

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Optional: Inject fake data (tags/weekly summaries)

There is a helper script to generate sample posts (including `tags`) for local testing:

```bash
python inject_fake_data.py
```

This uses whatever database is configured via `DATABASE_URL` (SQLite by default).

## Database Configuration

### SQLite (Default for Development)

- **Pros**: No setup required, perfect for local development
- **Cons**: Not suitable for production, limited concurrency
- **Usage**: Simply don't set `DATABASE_URL` in `.env`

The database file will be created at `backend/bbs.db`

### PostgreSQL (Recommended for Production)

- **Pros**: Production-ready, better performance, supports concurrent connections
- **Cons**: Requires PostgreSQL installation and setup
- **Usage**: Set `DATABASE_URL` in `.env` to your PostgreSQL connection string

Example connection strings:
- Local: `postgresql://user:password@localhost:5432/bbs`
- Remote: `postgresql://user:password@host:5432/bbs`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

## Project Structure

```
backend/
├── app/
│   ├── models/          # SQLAlchemy database models
│   ├── schemas/         # Pydantic schemas for API
│   ├── routers/         # API route handlers
│   ├── services/        # Business logic
│   ├── middleware/      # Authentication middleware
│   ├── config.py        # Configuration
│   ├── database.py      # Database setup
│   └── main.py          # FastAPI application
├── alembic/             # Database migrations
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Features

- RESTful API with FastAPI
- SQLAlchemy ORM for database operations
- Alembic for database migrations
- JWT authentication
- Google OAuth integration
- Support for anonymous posts and comments
- Post tags (`posts.tags`) stored as JSON-in-text (SQLite-compatible)
- CORS configuration
- Automatic API documentation

## Troubleshooting

### Alembic Errors with Python 3.13+

If you encounter errors like `AssertionError: Class <class 'sqlalchemy.sql.elements.SQLCoreOperations'> directly inherits TypingOnly` when running `alembic upgrade head`:

This is because SQLAlchemy 2.0.23 and earlier versions are not compatible with Python 3.13. The requirements.txt has been updated to use SQLAlchemy 2.0.31+ which supports Python 3.13.

**Solution:**
1. **Update SQLAlchemy:**
   ```bash
   pip install --upgrade "sqlalchemy>=2.0.31"
   ```

2. **If no migration files exist, create the initial migration:**
   ```bash
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

### pydantic-core Build Errors (Python 3.13+)

If you encounter errors like "Failed to build installable wheels for pydantic-core" when using Python 3.13 or newer:

1. **Update pip, setuptools, and wheel first:**
   ```bash
   python -m pip install --upgrade pip setuptools wheel
   ```

2. **The requirements.txt has been updated to use Pydantic 2.8.0+** which supports Python 3.13. If you're using an older requirements.txt, update it:
   ```bash
   pip install "pydantic>=2.8.0" "pydantic-settings>=2.5.0"
   ```

3. **If you still have issues, ensure you're using a virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install --upgrade pip setuptools wheel
   pip install -r requirements.txt
   ```

### psycopg2-binary Installation Issues (macOS)

If you encounter errors installing `psycopg2-binary` on macOS (especially Apple Silicon), try:

1. **Install PostgreSQL client libraries:**
   ```bash
   brew install postgresql
   export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
   pip install -r requirements-postgres.txt
   ```

2. **If you still have issues, install OpenSSL:**
   ```bash
   brew install openssl@3
   export LDFLAGS="-L/opt/homebrew/opt/openssl@3/lib"
   export CPPFLAGS="-I/opt/homebrew/opt/openssl@3/include"
   pip install -r requirements-postgres.txt
   ```

3. **Use a newer version (if 2.9.9 fails):**
   ```bash
   pip install psycopg2-binary
   ```

4. **Note:** If you're using SQLite (default), you don't need `psycopg2-binary` at all. Only install it if you're using PostgreSQL.

### Database Connection Errors

- **SQLite**: Ensure the backend directory is writable
- **PostgreSQL**: Verify the database exists and credentials are correct

### Migration Errors

- Make sure you're using the correct database (SQLite vs PostgreSQL)
- If switching databases, you may need to recreate migrations

### OAuth Errors

- Verify redirect URI matches exactly in Google Cloud Console
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
