from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class User(UserBase):
    id: UUID
    created_at: datetime
    last_login: datetime
    
    class Config:
        from_attributes = True


class UserInDB(User):
    pass
