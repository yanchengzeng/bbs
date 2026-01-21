from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database - defaults to SQLite for local development
    database_url: Optional[str] = None
    
    # Google OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: Optional[str] = None
    
    # JWT
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # CORS
    frontend_url: str = "http://localhost:5173"
    
    @property
    def get_database_url(self) -> str:
        """Get database URL, defaulting to SQLite if not set"""
        if self.database_url:
            return self.database_url
        # Default to SQLite for local development
        return "sqlite:///./bbs.db"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
