from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID
from app.schemas.user import User


class CommentBase(BaseModel):
    content: str
    anonymous_name: Optional[str] = None


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: Optional[str] = None


class Comment(CommentBase):
    id: UUID
    post_id: UUID
    user_id: Optional[UUID] = None
    anonymous_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_edited: bool
    
    class Config:
        from_attributes = True


class CommentWithUser(Comment):
    user: Optional[User] = None
    anonymous_name: Optional[str] = None
