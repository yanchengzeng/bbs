from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from app.schemas.user import User
from app.schemas.comment import CommentWithUser


class PostBase(BaseModel):
    content: str
    tags: Optional[List[str]] = []


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    content: Optional[str] = None
    tags: Optional[List[str]] = None


class Post(PostBase):
    id: UUID
    user_id: Optional[UUID] = None
    anonymous_name: Optional[str] = None
    tags: Optional[List[str]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_edited: bool
    
    class Config:
        from_attributes = True


class PostWithUser(Post):
    user: Optional[User] = None
    anonymous_name: Optional[str] = None
    tags: Optional[List[str]] = []
    comments: List[CommentWithUser] = []
    like_count: int = 0
    is_liked: bool = False
