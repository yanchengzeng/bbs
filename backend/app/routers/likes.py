from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
import logging
from app.database import get_db
from app.models.like import Like
from app.models.post import Post
from app.middleware.auth import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["likes"])


@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle like on post (requires authentication)"""
    try:
        logger.info(f"User {current_user.id} toggling like on post {post_id}")
        # Verify post exists
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            logger.warning(f"Post {post_id} not found for like toggle")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
        # Check if like already exists
        existing_like = db.query(Like).filter(
            Like.post_id == post_id,
            Like.user_id == current_user.id
        ).first()
        
        if existing_like:
            # Unlike
            logger.debug(f"Removing like from post {post_id} by user {current_user.id}")
            db.delete(existing_like)
            db.commit()
            like_count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
            logger.info(f"Post {post_id} unliked by user {current_user.id}, new count: {like_count}")
            return {"liked": False, "like_count": like_count}
        else:
            # Like
            logger.debug(f"Adding like to post {post_id} by user {current_user.id}")
            new_like = Like(
                post_id=post_id,
                user_id=current_user.id
            )
            db.add(new_like)
            db.commit()
            like_count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
            logger.info(f"Post {post_id} liked by user {current_user.id}, new count: {like_count}")
            return {"liked": True, "like_count": like_count}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling like on post {post_id}: {type(e).__name__} - {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle like"
        )


@router.get("/posts/{post_id}/likes")
async def get_likes(
    post_id: UUID,
    db: Session = Depends(get_db)
):
    """Get like count and list of users who liked the post"""
    try:
        logger.debug(f"Fetching likes for post {post_id}")
        # Verify post exists
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            logger.warning(f"Post {post_id} not found for likes query")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
        likes = db.query(Like).filter(Like.post_id == post_id).all()
        like_count = len(likes)
        logger.debug(f"Found {like_count} likes for post {post_id}")
        
        users = [like.user for like in likes]
        
        return {
            "like_count": like_count,
            "users": [{"id": str(u.id), "name": u.name, "avatar_url": u.avatar_url} for u in users]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching likes for post {post_id}: {type(e).__name__} - {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch likes"
        )
