from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
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

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to improve HTTPS trust"""
    response = await call_next(request)
    # Check if request is HTTPS (works with reverse proxies via X-Forwarded-Proto)
    is_https = (
        request.url.scheme == "https" or 
        request.headers.get("X-Forwarded-Proto") == "https" or
        request.headers.get("X-Forwarded-Ssl") == "on"
    )
    # Add HSTS header to force HTTPS (only if request is HTTPS)
    if is_https:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # Add other security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests for debugging"""
    logger.info(f"Incoming request: {request.method} {request.url.path} - Query: {dict(request.query_params)}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code} for {request.method} {request.url.path}")
    return response

# Custom 404 handler
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with detailed logging"""
    if exc.status_code == 404:
        logger.warning(
            f"404 Not Found: {request.method} {request.url.path} - "
            f"Query params: {dict(request.query_params)} - "
            f"Headers: {dict(request.headers)}"
        )
        return JSONResponse(
            status_code=404,
            content={
                "detail": f"Route not found: {request.url.path}",
                "method": request.method,
                "path": request.url.path
            }
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

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
    
    # Log registered routes for debugging
    auth_routes = [route for route in app.routes if hasattr(route, "path") and "/auth" in route.path]
    logger.info(f"Registered auth routes: {[route.path for route in auth_routes if hasattr(route, 'path')]}")

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


@app.get("/routes")
async def list_routes():
    """List all registered routes for debugging"""
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else ["GET"]
            })
    return {"routes": routes}
