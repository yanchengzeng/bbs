from sqlalchemy import Column, Text, DateTime, Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.dialects import sqlite
from sqlalchemy.types import TypeDecorator, VARCHAR
import json
import uuid
from datetime import datetime
from app.database import Base
from app.models.uuid_type import GUID


class JSONEncodedDict(TypeDecorator):
    """Represents an immutable structure as a json-encoded string."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return []


class Post(Base):
    __tablename__ = "posts"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    anonymous_name = Column(String, nullable=True)  # For anonymous posts
    content = Column(Text, nullable=False)
    tags = Column(JSONEncodedDict, nullable=True, default=list)  # Store tags as JSON array
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True)
    is_edited = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
