from sqlalchemy import Column, Text, DateTime, Boolean, ForeignKey, String
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base
from app.models.uuid_type import GUID


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    post_id = Column(GUID(), ForeignKey("posts.id"), nullable=False)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    anonymous_name = Column(String, nullable=True)  # For anonymous comments
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True)
    is_edited = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")
