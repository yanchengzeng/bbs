from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from app.database import get_db
from app.models.like import Like
from app.models.post import Post
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api", tags=["likes"])


@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle like on post (requires authentication)"""
    # Verify post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Check if like already exists
    existing_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        db.commit()
        return {"liked": False, "like_count": db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0}
    else:
        # Like
        new_like = Like(
            post_id=post_id,
            user_id=current_user.id
        )
        db.add(new_like)
        db.commit()
        return {"liked": True, "like_count": db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0}


@router.get("/posts/{post_id}/likes")
async def get_likes(
    post_id: UUID,
    db: Session = Depends(get_db)
):
    """Get like count and list of users who liked the post"""
    # Verify post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    likes = db.query(Like).filter(Like.post_id == post_id).all()
    like_count = len(likes)
    
    users = [like.user for like in likes]
    
    return {
        "like_count": like_count,
        "users": [{"id": str(u.id), "name": u.name, "avatar_url": u.avatar_url} for u in users]
    }
