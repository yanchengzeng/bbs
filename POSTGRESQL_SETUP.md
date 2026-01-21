# PostgreSQL Setup Guide

This guide explains how to use PostgreSQL in production while keeping SQLite for local development.

## Current State

**Good News:** The codebase already supports both SQLite and PostgreSQL! The database is selected automatically based on the `DATABASE_URL` environment variable.

**Current Behavior:**
- **No `DATABASE_URL` set** → Uses SQLite (`sqlite:///./bbs.db`)
- **`DATABASE_URL` set** → Uses the specified database (PostgreSQL)

## Code Changes Needed

### Option 1: No Code Changes (Current Setup)

The current code works with both databases, but UUIDs are stored as text in SQLite. This is fine for development but not optimal.

### Option 2: Improve UUID Compatibility (Recommended)

For better cross-database compatibility, create a UUID type that works seamlessly with both databases:

**Create `backend/app/models/uuid_type.py`:**

```python
"""UUID type that works with both SQLite and PostgreSQL"""
from sqlalchemy import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
import uuid


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    
    Uses PostgreSQL's UUID type when available, otherwise uses CHAR(36).
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PostgresUUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value
```

**Then update all model files to use `GUID` instead of `UUID`:**

In `backend/app/models/user.py`, `comment.py`, `like.py`, `post.py`:

```python
# Change from:
from sqlalchemy.dialects.postgresql import UUID

# To:
from app.models.uuid_type import GUID as UUID
```

**Note:** This is optional - the current code works, but this improves type handling.

## Configuration: Dev vs Production

### Development (SQLite) - No Configuration Needed

**`backend/.env` (or leave it empty):**
```env
# Leave DATABASE_URL unset or commented out
# DATABASE_URL=

SECRET_KEY=dev-secret-key-for-local-testing
FRONTEND_URL=http://localhost:5173
```

The app will automatically use SQLite and create `backend/bbs.db`.

### Production (PostgreSQL) - Set DATABASE_URL

**`backend/.env` (production):**
```env
# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@host:5432/database_name

SECRET_KEY=your-production-secret-key-change-this
FRONTEND_URL=https://your-frontend-domain.com

# Google OAuth (production URLs)
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://your-backend-domain.com/auth/google/callback
```

### Environment-Specific Configuration

#### Option A: Separate `.env` Files (Recommended)

1. **Development:** `backend/.env` (no DATABASE_URL)
2. **Production:** `backend/.env.production` (with DATABASE_URL)

Then load the appropriate file:
```python
# In app/config.py, you could add:
import os
env_file = ".env.production" if os.getenv("ENVIRONMENT") == "production" else ".env"
```

#### Option B: Environment Variables (Best for Production)

Set environment variables directly (no `.env` file in production):

**Development:**
```bash
# Use .env file (no DATABASE_URL)
```

**Production (Docker/Cloud):**
```bash
export DATABASE_URL=postgresql://user:pass@host:5432/db
export SECRET_KEY=production-secret-key
export FRONTEND_URL=https://your-frontend.com
# etc.
```

#### Option C: Multiple Environment Files

Create:
- `backend/.env.development` (SQLite)
- `backend/.env.production` (PostgreSQL)
- `backend/.env.staging` (PostgreSQL)

Load based on `ENVIRONMENT` variable.

## Step-by-Step: Setting Up PostgreSQL for Production

### 1. Install PostgreSQL Dependencies

```bash
cd backend
pip install -r requirements-postgres.txt
```

### 2. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bbs;

# Create user (optional, recommended)
CREATE USER bbs_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bbs TO bbs_user;

# Exit psql
\q
```

### 3. Configure Environment

Create or update `backend/.env`:

```env
DATABASE_URL=postgresql://bbs_user:your_secure_password@localhost:5432/bbs
SECRET_KEY=your-production-secret-key-minimum-32-characters
FRONTEND_URL=https://your-frontend-domain.com
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://your-backend-domain.com/auth/google/callback
```

### 4. Run Migrations

```bash
cd backend
source .venv/bin/activate  # Activate virtual environment
alembic upgrade head
```

This will create all tables in PostgreSQL.

### 5. Verify Connection

```bash
# Test database connection
python -c "from app.database import engine; print(engine.url)"
```

Should show your PostgreSQL connection string.

## Switching Between SQLite and PostgreSQL

### Switch to PostgreSQL (Development)

1. Install PostgreSQL dependencies:
   ```bash
   pip install -r requirements-postgres.txt
   ```

2. Set `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/bbs
   ```

3. Run migrations:
   ```bash
   alembic upgrade head
   ```

### Switch Back to SQLite (Development)

1. Remove or comment out `DATABASE_URL` in `.env`:
   ```env
   # DATABASE_URL=
   ```

2. The app will automatically use SQLite on next restart.

**Note:** Your PostgreSQL data remains intact - you're just switching which database the app uses.

## Production Deployment Checklist

- [ ] Install PostgreSQL dependencies: `pip install -r requirements-postgres.txt`
- [ ] Set `DATABASE_URL` environment variable
- [ ] Set secure `SECRET_KEY` (use `openssl rand -hex 32`)
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Configure Google OAuth with production redirect URI
- [ ] Run migrations: `alembic upgrade head`
- [ ] Test database connection
- [ ] Set up database backups
- [ ] Configure connection pooling (if needed)
- [ ] Set up SSL/TLS for database connection (production)

## Connection String Formats

### PostgreSQL

```
postgresql://username:password@host:port/database_name
```

Examples:
- Local: `postgresql://postgres:password@localhost:5432/bbs`
- Remote: `postgresql://user:pass@db.example.com:5432/bbs`
- With SSL: `postgresql://user:pass@host:5432/bbs?sslmode=require`

### SQLite

```
sqlite:///./bbs.db          # Relative path
sqlite:////absolute/path.db  # Absolute path
sqlite:///:memory:          # In-memory (testing)
```

## Troubleshooting

### "No module named 'psycopg2'"

Install PostgreSQL dependencies:
```bash
pip install -r requirements-postgres.txt
```

### "Connection refused" or "Database does not exist"

1. Verify PostgreSQL is running: `pg_isready`
2. Check database exists: `psql -l | grep bbs`
3. Verify connection string format
4. Check firewall/network settings

### Migration Errors When Switching Databases

Each database has its own migration state. If you switch databases:

1. **SQLite → PostgreSQL:** Run `alembic upgrade head` (fresh start)
2. **PostgreSQL → SQLite:** Run `alembic upgrade head` (fresh start)

**Note:** Data doesn't transfer automatically - you'd need to export/import.

### UUID Type Errors

If you see UUID-related errors when switching databases, consider implementing the `GUID` type wrapper mentioned in "Option 2" above.

## Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Use different secrets** for dev/staging/production
3. **Use connection pooling** in production (SQLAlchemy handles this)
4. **Backup regularly** - PostgreSQL: `pg_dump`, SQLite: copy the `.db` file
5. **Monitor database size** - PostgreSQL can grow large, plan accordingly
6. **Use SSL/TLS** for production database connections

## Summary

**To use PostgreSQL in production:**

1. ✅ **No code changes required** - Current code supports both
2. ✅ **Set `DATABASE_URL`** in production environment
3. ✅ **Install PostgreSQL dependencies:** `pip install -r requirements-postgres.txt`
4. ✅ **Run migrations:** `alembic upgrade head`

**For development:**
- Leave `DATABASE_URL` unset → Uses SQLite automatically
- No PostgreSQL installation needed

The app automatically detects which database to use based on the `DATABASE_URL` environment variable!
