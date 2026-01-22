# Deployment Guide

This guide covers deploying the BBS application to production using:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Render PostgreSQL

## Prerequisites

- GitHub repository with your code
- Vercel account (free tier available)
- Render account (free tier available)
- Google OAuth credentials configured for production

## Step 1: Set Up Render PostgreSQL Database

### 1.1 Create PostgreSQL Database on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `bbs-database` (or your preferred name)
   - **Database**: `bbs`
   - **User**: Auto-generated (save this)
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 16 (recommended)
   - **Plan**: Free tier or paid (free tier has limitations)
4. Click **"Create Database"**
5. **Important**: Copy the **Internal Database URL** (starts with `postgresql://`)
   - This is different from the External Connection String
   - Internal URL is for backend → database communication
   - Format: `postgresql://user:password@hostname:5432/database`

### 1.2 Save Database Credentials

You'll need these for the backend configuration:
- Internal Database URL (for backend)
- Database name
- Username
- Password

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the repository containing your BBS code
4. Configure the service:

   **Basic Settings:**
   - **Name**: `bbs-backend`
   - **Region**: Same as database (for lower latency)
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `backend` (important!)
   - **Runtime**: `Python 3` (will use Python 3.12.7 from `runtime.txt`)
   -    **Build Command**: 
     ```bash
     pip install -r requirements.txt && pip install -r requirements-postgres.txt
     ```
   - **Start Command**: 
     ```bash
     alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   
   **Note:** 
   - Render automatically sets the `$PORT` environment variable. The start command runs migrations first, then starts the server.
   - The `runtime.txt` file in the backend directory pins Python to 3.12.7 to ensure compatibility with `psycopg2-binary`. Render will automatically use this version.

5. **Before clicking "Create Web Service"**, you'll set environment variables after creation (easier to manage)

6. Click **"Create Web Service"**

7. **After the service is created**, go to the **"Environment"** tab and add these variables (see "Environment Variables Summary" section below for details):
   
   - `DATABASE_URL` - Internal Database URL from Step 1.1
   - `SECRET_KEY` - Generate a secure random string (see below)
   - `ALGORITHM` - `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` - `15`
   - `REFRESH_TOKEN_EXPIRE_DAYS` - `7`
   - `FRONTEND_URL` - You'll set this after deploying frontend (can use placeholder for now)
   - `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
   - `GOOGLE_REDIRECT_URI` - Will be `https://your-service-name.onrender.com/auth/google/callback`

   **Generate SECRET_KEY:**
   ```bash
   # On your local machine:
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   # Or use OpenSSL:
   openssl rand -hex 32
   ```
   
   **Important:** After adding environment variables, Render will automatically redeploy. You can also manually trigger a redeploy from the "Manual Deploy" tab.

### 2.2 Wait for Initial Deployment

- Render will build and deploy your backend
- First deployment takes 5-10 minutes
- Note your backend URL: `https://your-service-name.onrender.com`
- The deployment may fail initially if required environment variables are missing (this is normal)

### 2.3 Configure Environment Variables

After the service is created:

1. Go to your service → **"Environment"** tab
2. Add each environment variable (see "Environment Variables Summary" section)
3. **Important variables to set first:**
   - `DATABASE_URL` - Get from your PostgreSQL service → "Connections" → "Internal Database URL"
   - `SECRET_KEY` - Generate using command above
   - `GOOGLE_REDIRECT_URI` - Use your Render backend URL: `https://your-service-name.onrender.com/auth/google/callback`
4. Save changes (Render will auto-redeploy)

**Note:** You can set `FRONTEND_URL` later after deploying to Vercel.

## Step 3: Configure Google OAuth for Production

### 3.1 Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add **Authorized redirect URIs**:
   - `https://your-render-backend.onrender.com/auth/google/callback`
6. Add **Authorized JavaScript origins** (if needed):
   - `https://your-vercel-app.vercel.app`
7. Save changes

### 3.2 Update Environment Variables

Update `GOOGLE_REDIRECT_URI` in Render to match exactly:
```
GOOGLE_REDIRECT_URI=https://your-render-backend.onrender.com/auth/google/callback
```

## Step 4: Deploy Frontend to Vercel

### 4.1 Connect Repository

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select the repository

### 4.2 Configure Project

**Framework Preset:** Vite (should auto-detect)

**Root Directory:** `frontend` (important! This tells Vercel where your frontend code is)

**Build Settings** (usually auto-detected):
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Environment Variables:**
- Click **"Add"** to add environment variables
- Add: `VITE_API_URL` = `https://your-render-backend.onrender.com`
  - Replace with your actual Render backend URL from Step 2.2
  - **Important:** No trailing slash

**Important Notes:**
- Vercel environment variables starting with `VITE_` are exposed to the browser
- Never put secrets in `VITE_` variables
- The API URL should be your Render backend URL
- You can add variables for Production, Preview, and Development separately

### 4.3 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Note your frontend URL: `https://your-project.vercel.app` or `https://your-project-username.vercel.app`

### 4.4 Update Backend CORS

After getting your Vercel URL, update the backend environment variable in Render:

```
FRONTEND_URL = https://your-project.vercel.app
```

Then redeploy the backend (Render auto-redeploys on env var changes, or trigger manually).

## Step 5: Final Configuration

### 5.1 Update Frontend Environment Variable

If your backend URL changed, update in Vercel:
1. Go to your project → **Settings** → **Environment Variables**
2. Update `VITE_API_URL` to your Render backend URL
3. Redeploy (Vercel will auto-redeploy)

### 5.2 Verify Database Migrations

Check that migrations ran successfully:
1. Go to Render backend logs
2. Look for: `INFO: Application startup complete`
3. If you see migration errors, check the database connection

### 5.3 Test the Application

1. Visit your Vercel frontend URL
2. Try logging in with Google
3. Create a post
4. Verify everything works

## Environment Variables Summary

### How to Set Environment Variables

#### Render (Backend)

1. Go to Render Dashboard
2. Click on your backend service
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Enter key and value
6. Click **"Save Changes"**
7. Render will automatically redeploy when you save

**Important:** Render environment variables are case-sensitive. Use the exact names shown below.

#### Vercel (Frontend)

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **"Settings"** → **"Environment Variables"**
4. Click **"Add New"**
5. Enter key and value
6. Select environment (Production, Preview, Development)
7. Click **"Save"**
8. Redeploy to apply changes (or wait for next deployment)

**Important:** Vercel environment variables starting with `VITE_` are exposed to the browser. Never put secrets in these.

### Render Backend Environment Variables

Set these in **Render Dashboard → Your Service → Environment**:

| Variable | Description | Example/Notes |
|----------|-------------|---------------|
| `DATABASE_URL` | Internal PostgreSQL connection string from Render | `postgresql://user:password@hostname:5432/bbs`<br>**Use Internal URL, not External** |
| `SECRET_KEY` | JWT signing key (keep secret!) | Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`<br>**Must be 32+ characters** |
| `ALGORITHM` | JWT algorithm | `HS256` (default) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiration | `15` (default) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token expiration | `7` (default) |
| `FRONTEND_URL` | Your Vercel frontend URL | `https://your-vercel-app.vercel.app`<br>**No trailing slash** |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Must match Render backend URL | `https://your-render-backend.onrender.com/auth/google/callback`<br>**Must match exactly in Google Console** |

**Complete example:**
```bash
DATABASE_URL=postgresql://bbs_user:abc123@dpg-xxxxx-a.oregon-postgres.render.com/bbs
SECRET_KEY=your-super-secret-key-minimum-32-characters-long-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=https://bbs-app.vercel.app
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=https://bbs-backend.onrender.com/auth/google/callback
```

### Vercel Frontend Environment Variables

Set these in **Vercel Dashboard → Your Project → Settings → Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Your Render backend URL | `https://bbs-backend.onrender.com`<br>**No trailing slash** |

**Complete example:**
```bash
VITE_API_URL=https://bbs-backend.onrender.com
```

**Note:** After setting `VITE_API_URL`, you may need to trigger a new deployment for it to take effect.

## Troubleshooting

### Backend Won't Start

**Check Render logs:**
1. Go to Render Dashboard → Your Service → **"Logs"** tab
2. Look for errors in build or startup
3. Check both "Build Logs" and "Runtime Logs"

**Common issues:**

1. **Missing PostgreSQL dependencies:**
   - Error: `ModuleNotFoundError: No module named 'psycopg2'`
   - Fix: Ensure `requirements-postgres.txt` exists and build command includes it

2. **Database connection failed:**
   - Error: `could not connect to server` or `connection refused`
   - Fix: 
     - Verify `DATABASE_URL` uses **Internal Database URL** (not External)
     - Check database service is running in Render
     - Ensure database and backend are in same region

3. **Migration errors:**
   - Error: `alembic.util.exc.CommandError`
   - Fix: Check database is accessible and migrations are up to date

4. **Port binding error:**
   - Error: `Address already in use`
   - Fix: Ensure start command uses `$PORT` variable, not hardcoded port

5. **Environment variable not found:**
   - Error: `pydantic_settings.BaseSettings: field required`
   - Fix: Check all required environment variables are set in Render

### Database Connection Errors

**Verify DATABASE_URL:**
- Use **Internal Database URL** (not External)
- Format: `postgresql://user:password@hostname:5432/database`
- No SSL parameters needed for internal connections

**Test connection:**
```bash
# In Render Shell (if available) or locally:
psql "postgresql://user:password@hostname:5432/database"
```

### CORS Errors

**Symptoms:** Frontend can't call backend API

**Fix:**
1. Check `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Check `VITE_API_URL` in Vercel matches your Render backend URL
3. No trailing slashes in URLs
4. Redeploy both services after changes

### Google OAuth Not Working

**Symptoms:**
- Redirect to Google works, but callback fails
- "redirect_uri_mismatch" error
- User not created/logged in after OAuth

**Check:**
1. `GOOGLE_REDIRECT_URI` matches exactly in:
   - Render environment variables: `https://your-backend.onrender.com/auth/google/callback`
   - Google Cloud Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs
   - **Must match character-for-character, including https://**
2. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
   - Copy from Google Cloud Console → Credentials
   - No extra spaces or quotes
3. OAuth consent screen is published (if using external users)
   - Go to Google Cloud Console → OAuth consent screen
   - Must be "Published" for external users
4. Check Render logs for OAuth errors
   - Look for "Authentication failed" messages
   - Check if Google API calls are succeeding

### Images Not Loading

**Check:**
1. Browser console for CORS errors
2. Image URLs are accessible
3. `referrerPolicy` in UserAvatar component

## Render-Specific Notes

### Free Tier Limitations

- **Spins down after 15 minutes** of inactivity
- **First request after spin-down takes 30-60 seconds** (cold start)
- **Database**: 90-day retention, limited connections
- **Web Service**: 750 hours/month free

### Production Recommendations

1. **Upgrade to paid tier** for:
   - No spin-downs
   - Faster response times
   - Better database performance
   - More reliable service

2. **Use Render's Health Checks:**
   - Add health check endpoint: `/health`
   - Render will ping this to keep service alive

3. **Database Backups:**
   - Render provides automatic backups on paid tier
   - Free tier: Manual exports recommended

## Vercel-Specific Notes

### Custom Domain

1. Go to Vercel Project → Settings → Domains
2. Add your custom domain
3. Update `FRONTEND_URL` in Render
4. Update Google OAuth authorized origins

### Environment Variables

- **Development**: Set in Vercel Dashboard → Settings → Environment Variables
- **Preview**: Same as development (or separate)
- **Production**: Set separately for production branch

### Build Optimizations

Vercel automatically:
- Optimizes images
- Caches static assets
- Uses CDN for fast global delivery

## Security Checklist

- [ ] `SECRET_KEY` is strong random string (32+ characters)
- [ ] `SECRET_KEY` is different from development (never reuse dev secrets)
- [ ] Database credentials are secure (use Render's internal connection)
- [ ] Google OAuth secrets are not exposed (only in Render environment variables)
- [ ] CORS is properly configured (only your Vercel domain allowed)
- [ ] No secrets in frontend environment variables (only `VITE_API_URL`)
- [ ] HTTPS is enabled (automatic on Vercel/Render)
- [ ] Database uses internal connection (not external/public)
- [ ] Environment variables are set in platform UI (not committed to git)
- [ ] `.env` files are in `.gitignore` (verify they're not committed)
- [ ] Google OAuth redirect URI uses HTTPS
- [ ] All production URLs use HTTPS (no HTTP)

## Monitoring

### Render

- View logs: Dashboard → Service → Logs
- Monitor metrics: Dashboard → Service → Metrics
- Set up alerts: Dashboard → Service → Alerts

### Vercel

- View logs: Dashboard → Project → Deployments → Click deployment → Logs
- Analytics: Dashboard → Project → Analytics
- Speed Insights: Automatic

## Rollback Procedures

### Backend (Render)

1. Go to Render Dashboard → Service → Deploys
2. Find previous successful deployment
3. Click "..." → "Redeploy"

### Frontend (Vercel)

1. Go to Vercel Dashboard → Project → Deployments
2. Find previous deployment
3. Click "..." → "Promote to Production"

## Cost Estimation

### Free Tier (Development/Testing)

- **Render Backend**: Free (with limitations)
- **Render PostgreSQL**: Free (90-day retention)
- **Vercel Frontend**: Free (generous limits)
- **Total**: $0/month

### Paid Tier (Production)

- **Render Backend**: ~$7-25/month (Starter plan)
- **Render PostgreSQL**: ~$7-20/month (Starter plan)
- **Vercel Frontend**: Free (or Pro at $20/month for teams)
- **Total**: ~$14-45/month

## Next Steps

1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up database backups
4. Configure CI/CD (automatic on Vercel/Render with GitHub)
5. Add error tracking (Sentry, etc.)
6. Set up analytics

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://react.dev/learn/start-a-new-react-project#production-builds)
