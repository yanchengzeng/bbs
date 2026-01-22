from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, posts, comments, likes, users, search

app = FastAPI(title="BBS Text Social Platform", version="1.0.0")

# Normalize frontend URL (remove trailing slash if present)
frontend_url = settings.frontend_url.rstrip('/')

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
