from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class LikeBase(BaseModel):
    post_id: UUID


class LikeCreate(LikeBase):
    pass


class Like(LikeBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
