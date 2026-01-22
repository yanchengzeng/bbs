from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import urllib.parse

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
    # PostgreSQL - handle Supabase and other cloud providers
    connect_args = {
        "connect_timeout": 10,  # 10 second connection timeout
    }
    
    # Supabase requires SSL connections
    if "supabase.co" in database_url:
        # Parse the URL to add SSL parameters if not present
        parsed = urllib.parse.urlparse(database_url)
        query_params = urllib.parse.parse_qs(parsed.query)
        
        # Add SSL mode if not already specified
        if 'sslmode' not in query_params:
            query_params['sslmode'] = ['require']
            # Also set in connect_args for psycopg2 compatibility
            connect_args['sslmode'] = 'require'
        
        # Reconstruct the URL with SSL parameters
        new_query = urllib.parse.urlencode(query_params, doseq=True)
        database_url = urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
    
    # Create engine with connection pool settings for cloud databases
    engine = create_engine(
        database_url,
        echo=False,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=300,  # Recycle connections after 5 minutes
        connect_args=connect_args
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
