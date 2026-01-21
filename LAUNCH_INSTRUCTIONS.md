# Step-by-Step Launch Instructions

This guide will walk you through launching the entire BBS application locally (SQLite by default), with optional PostgreSQL instructions.

## Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn

## Step 1: Backend Setup

### 1.1 Navigate to Backend Directory

```bash
cd backend
```

### 1.2 Create Virtual Environment

```bash
python -m venv .venv
```

### 1.3 Activate Virtual Environment

**On macOS/Linux:**
```bash
source .venv/bin/activate
```

**On Windows:**
```bash
.venv\Scripts\activate
```

You should see `(.venv)` in your terminal prompt.

### 1.4 Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Note:** The app uses SQLite by default, so you don't need PostgreSQL dependencies. If you plan to use PostgreSQL instead, also run:
```bash
pip install -r requirements-postgres.txt
```

If you encounter issues installing `psycopg2-binary` on macOS, see the troubleshooting section in `backend/README.md`.

### 1.5 Create Environment File

```bash
cp env.example .env
```

### 1.6 Configure Environment (Optional for Local Testing)

For local testing with SQLite, you can use minimal configuration. Edit `.env`:

```env
# Leave DATABASE_URL empty or unset to use SQLite (default)
# DATABASE_URL=

# For local testing, you can use a simple secret key
SECRET_KEY=dev-secret-key-for-local-testing

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google OAuth (optional - only needed if you want to test login)
# If not set, you can still use anonymous posting
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

**Note:** For anonymous posting (no login required), you don't need Google OAuth credentials. The app will work without them.

### 1.7 Initialize Database

Run the database migrations to create the SQLite database:

```bash
alembic upgrade head
```

This will create `bbs.db` in the `backend/` directory.

### 1.8 Start Backend Server

```bash
uvicorn app.main:app --reload
```

The backend will start at `http://localhost:8000`

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Keep this terminal window open!**

## Step 2: Frontend Setup

### 2.1 Open a New Terminal Window

Keep the backend running in the first terminal, and open a new terminal window.

### 2.2 Navigate to Frontend Directory

```bash
cd frontend
```

(If you're in the backend directory, go back first: `cd ..` then `cd frontend`)

### 2.3 Install Node Dependencies

```bash
npm install
```

This may take a minute or two.

### 2.4 Create Environment File

```bash
cp env.example .env
```

### 2.5 Configure Frontend Environment

The `.env` file should already have the correct default. Verify it contains:

```env
VITE_API_URL=http://localhost:8000
```

### 2.6 Start Frontend Development Server

```bash
npm run dev
```

The frontend will start at `http://localhost:5173`

You should see output like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 3: Access the Application

1. Open your web browser
2. Navigate to `http://localhost:5173`
3. You should see the BBS homepage

## Step 4: Test the Application

### Test Anonymous Posting (No Login Required)

1. You should see a post form at the bottom of the page
2. Enter a name (optional, defaults to "Anonymous")
3. Write your post content
4. Click "Post"
5. Your post should appear in the feed!

### Test Anonymous Comments

1. Click the comment button (💬) on any post
2. Enter a name (optional)
3. Write your comment
4. Click "Post Comment"
5. Your comment should appear!

### Test Login (Optional - Requires Google OAuth Setup)

If you've configured Google OAuth:
1. Click "Login" in the header
2. Click "Login with Google"
3. Complete Google authentication
4. You'll be redirected back and logged in

## Verifying SQLite Database

The SQLite database file `bbs.db` will be created in the `backend/` directory after running migrations.

To verify it exists:

```bash
ls -la backend/bbs.db
```

Or on Windows:
```bash
dir backend\bbs.db
```

You can also inspect the database using SQLite:

```bash
sqlite3 backend/bbs.db
.tables
.quit
```

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Find and kill the process using port 8000
# On macOS/Linux:
lsof -ti:8000 | xargs kill

# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Database migration errors:**
```bash
# Delete the database and recreate
rm backend/bbs.db  # On Windows: del backend\bbs.db
alembic upgrade head
```

**Module not found errors:**
```bash
# Make sure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

**Port 5173 already in use:**
- Vite will automatically try the next available port (5174, 5175, etc.)
- Check the terminal output for the actual port

**API connection errors:**
- Verify backend is running on `http://localhost:8000`
- Check `VITE_API_URL` in `frontend/.env`
- Open browser console (F12) to see detailed errors

**Build errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules  # On Windows: rmdir /s node_modules
npm install
```

### CORS Errors

If you see CORS errors in the browser console:
1. Check that `FRONTEND_URL` in `backend/.env` matches your frontend URL
2. Restart the backend server after changing `.env`

## Stopping the Application

1. **Stop Frontend:** Press `Ctrl+C` in the frontend terminal
2. **Stop Backend:** Press `Ctrl+C` in the backend terminal
3. **Deactivate Virtual Environment (optional):**
   ```bash
   deactivate
   ```

## Quick Reference

### Backend Commands
```bash
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload
```

### Frontend Commands
```bash
cd frontend
npm run dev
```

### Database Commands
```bash
# Create migrations
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migrations
alembic downgrade -1
```

## Next Steps

- **API Documentation:** Visit `http://localhost:8000/docs` to see the interactive API documentation
- **Test Anonymous Features:** Try posting and commenting without logging in
- **Set Up Google OAuth:** Follow the instructions in `backend/README.md` to enable login functionality

## File Locations

- **SQLite Database:** `backend/bbs.db` (created automatically)
- **Backend Logs:** Check the terminal where `uvicorn` is running
- **Frontend Logs:** Check the browser console (F12) and the terminal where `npm run dev` is running
