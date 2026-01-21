from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.database import get_db
from app.models.comment import Comment
from app.models.post import Post
from app.schemas.comment import Comment as CommentSchema, CommentCreate, CommentUpdate, CommentWithUser
from app.middleware.auth import get_current_user, get_optional_user
from app.models.user import User

router = APIRouter(prefix="/api", tags=["comments"])


@router.post("/posts/{post_id}/comments", response_model=CommentWithUser, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: UUID,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user)
):
    """Add comment to post (authenticated or anonymous)"""
    # Verify post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Allow anonymous comments if no user is logged in
    if current_user:
        db_comment = Comment(
            post_id=post_id,
            user_id=current_user.id,
            content=comment.content
        )
    else:
        # Anonymous comment
        anonymous_name = comment.anonymous_name or "Anonymous"
        db_comment = Comment(
            post_id=post_id,
            user_id=None,
            anonymous_name=anonymous_name,
            content=comment.content
        )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Build CommentWithUser manually to handle anonymous comments
    return CommentWithUser(
        id=db_comment.id,
        post_id=db_comment.post_id,
        user_id=db_comment.user_id,
        anonymous_name=db_comment.anonymous_name,
        content=db_comment.content,
        created_at=db_comment.created_at,
        updated_at=db_comment.updated_at,
        is_edited=db_comment.is_edited,
        user=db_comment.user if db_comment.user_id else None
    )


@router.put("/comments/{comment_id}", response_model=CommentSchema)
async def update_comment(
    comment_id: UUID,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update comment (owner only, authenticated users only)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    # Only authenticated users can update comments, and only their own
    if not comment.user_id or comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )
    
    if comment_update.content is not None:
        comment.content = comment_update.content
        comment.updated_at = datetime.utcnow()
        comment.is_edited = True
    
    db.commit()
    db.refresh(comment)
    return CommentSchema.model_validate(comment)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete comment (owner only, authenticated users only)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    # Only authenticated users can delete comments, and only their own
    if not comment.user_id or comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    db.delete(comment)
    db.commit()
    return None
