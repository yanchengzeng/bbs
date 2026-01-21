from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base
from app.models.uuid_type import GUID


class User(Base):
    __tablename__ = "users"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
