"""
Script to initialize the database.
Run this after setting up your .env file and before running migrations.
"""
from app.database import engine, Base
from app.models import User, Post, Comment, Like, Tag

def init_db():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
