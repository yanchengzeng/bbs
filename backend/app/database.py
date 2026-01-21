from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Support both SQLite and PostgreSQL
database_url = settings.get_database_url

# SQLite needs special configuration
if database_url.startswith("sqlite"):
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},  # Needed for SQLite
        echo=False
    )
else:
    # PostgreSQL
    engine = create_engine(database_url, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
