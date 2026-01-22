from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback
from app.config import settings
from app.routers import auth, posts, comments, likes, users, search

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="BBS Text Social Platform", version="1.0.0")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions with logging"""
    logger.error(
        f"Unhandled exception: {type(exc).__name__} - {str(exc)}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
            "traceback": traceback.format_exc()
        }
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_type": type(exc).__name__
        }
    )

# Normalize frontend URL (remove trailing slash if present)
frontend_url = settings.frontend_url.rstrip('/')
logger.info(f"CORS configured for frontend: {frontend_url}")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Log startup
@app.on_event("startup")
async def startup_event():
    logger.info("BBS API starting up...")
    logger.info(f"Frontend URL: {frontend_url}")
    logger.info(f"Database URL configured: {'Yes' if settings.database_url else 'No (using SQLite)'}")
    logger.info(f"Google OAuth configured: {'Yes' if settings.google_client_id else 'No'}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("BBS API shutting down...")

# Include routers
app.include_router(auth.router, prefix="/auth")
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(likes.router)
app.include_router(users.router)
app.include_router(search.router)


@app.get("/")
async def root():
    return {"message": "BBS Text Social Platform API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
