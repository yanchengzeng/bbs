from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base
from app.models.uuid_type import GUID


class Like(Base):
    __tablename__ = "likes"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    post_id = Column(GUID(), ForeignKey("posts.id"), nullable=False)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")
    
    # Unique constraint to prevent duplicate likes
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="unique_post_user_like"),)
