from sqlalchemy import Column, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.uuid_type import GUID
import uuid


# Association table for many-to-many relationship between posts and tags
post_tags = Table(
    'post_tags',
    Base.metadata,
    Column('post_id', GUID(), ForeignKey('posts.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_name', String, ForeignKey('tags.name', ondelete='CASCADE'), primary_key=True)
)


class Tag(Base):
    __tablename__ = "tags"
    
    name = Column(String, primary_key=True)  # Tag name is the primary key
    
    # Relationship to posts
    posts = relationship("Post", secondary=post_tags, back_populates="tag_objects")
