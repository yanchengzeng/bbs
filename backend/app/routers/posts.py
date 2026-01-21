from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, date
from typing import Optional
from uuid import UUID
import hashlib
from app.database import get_db
from app.models.post import Post
from app.models.like import Like
from app.schemas.post import Post as PostSchema, PostCreate, PostUpdate, PostWithUser
from app.schemas.comment import CommentWithUser
from app.middleware.auth import get_current_user, get_optional_user
from app.models.user import User

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=list[PostWithUser])
async def get_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[UUID] = Query(None),
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get all posts with pagination"""
    query = db.query(Post)
    
    if user_id:
        query = query.filter(Post.user_id == user_id)
    
    if date:
        try:
            filter_date = datetime.strptime(date, '%Y-%m-%d').date()
            # Filter posts created on the specified date
            # Use date() function to extract date part (works with SQLite and PostgreSQL)
            query = query.filter(
                func.date(Post.created_at) == filter_date
            )
        except ValueError:
            # Invalid date format, ignore the filter
            pass
    
    posts = query.order_by(desc(Post.created_at)).offset((page - 1) * limit).limit(limit).all()
    
    result = []
    for post in posts:
        # Get comments with user info
        comments = post.comments
        comments_with_user = []
        for comment in comments:
            comment_dict = CommentWithUser(
                id=comment.id,
                post_id=comment.post_id,
                user_id=comment.user_id,
                anonymous_name=comment.anonymous_name,
                content=comment.content,
                created_at=comment.created_at,
                updated_at=comment.updated_at,
                is_edited=comment.is_edited,
                user=comment.user if comment.user_id else None
            )
            comments_with_user.append(comment_dict)
        
        # Get like count
        like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
        
        # Check if current user liked this post
        is_liked = False
        if current_user:
            is_liked = db.query(Like).filter(
                Like.post_id == post.id,
                Like.user_id == current_user.id
            ).first() is not None
        
        # Create PostWithUser with all data
        post_dict = PostWithUser(
            id=post.id,
            user_id=post.user_id,
            anonymous_name=post.anonymous_name,
            content=post.content,
            tags=post.tags or [],
            created_at=post.created_at,
            updated_at=post.updated_at,
            is_edited=post.is_edited,
            user=post.user if post.user_id else None,
            comments=comments_with_user,
            like_count=like_count,
            is_liked=is_liked
        )
        result.append(post_dict)
    
    return result


@router.get("/{post_id}", response_model=PostWithUser)
async def get_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get single post with comments"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Get comments with user info
    comments = post.comments
    comments_with_user = []
    for comment in comments:
        comment_dict = CommentWithUser(
            id=comment.id,
            post_id=comment.post_id,
            user_id=comment.user_id,
            anonymous_name=comment.anonymous_name,
            content=comment.content,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            is_edited=comment.is_edited,
            user=comment.user if comment.user_id else None
        )
        comments_with_user.append(comment_dict)
    
    # Get like count
    like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
    
    # Check if current user liked this post
    is_liked = False
    if current_user:
        is_liked = db.query(Like).filter(
            Like.post_id == post.id,
            Like.user_id == current_user.id
        ).first() is not None
    
    # Create PostWithUser with all data
    post_dict = PostWithUser(
        id=post.id,
        user_id=post.user_id,
        anonymous_name=post.anonymous_name,
        content=post.content,
        tags=post.tags or [],
        created_at=post.created_at,
        updated_at=post.updated_at,
        is_edited=post.is_edited,
        user=post.user if post.user_id else None,
        comments=comments_with_user,
        like_count=like_count,
        is_liked=is_liked
    )
    
    return post_dict


def get_client_ip(request: Request) -> str:
    """Get client IP address from request"""
    # Check for forwarded IP (when behind proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP in the chain
        return forwarded.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client
    if request.client:
        return request.client.host
    
    return "0.0.0.0"


def create_user_from_ip(ip: str, db: Session) -> User:
    """Create a user from IP address hash"""
    # Hash the IP address
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()
    # Take first 6 characters
    ip_prefix = ip_hash[:6]
    
    # Create username
    username = f"anonymous_{ip_prefix}"
    
    # Use a valid email domain format
    email = f"{username}@example.com"
    
    # Check if user already exists (check both new and old email formats)
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        # If user has old email format, update it
        if existing_user.email.endswith('@anonymous.local'):
            existing_user.email = email
            db.commit()
            db.refresh(existing_user)
        return existing_user
    
    # Also check for old format
    old_email = f"{username}@anonymous.local"
    existing_user_old = db.query(User).filter(User.email == old_email).first()
    if existing_user_old:
        # Update to new format
        existing_user_old.email = email
        db.commit()
        db.refresh(existing_user_old)
        return existing_user_old
    
    # Create new user
    new_user = User(
        email=email,
        name=username
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("", response_model=PostSchema, status_code=status.HTTP_201_CREATED)
async def create_post(
    post: PostCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Create new post (authenticated or auto-create user from IP)"""
    if current_user:
        # Authenticated user
        db_post = Post(
            user_id=current_user.id,
            content=post.content,
            tags=post.tags or []
        )
    else:
        # Auto-create user from IP
        client_ip = get_client_ip(request)
        ip_user = create_user_from_ip(client_ip, db)
        db_post = Post(
            user_id=ip_user.id,
            content=post.content,
            tags=post.tags or []
        )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return PostSchema.model_validate(db_post)


@router.put("/{post_id}", response_model=PostSchema)
async def update_post(
    post_id: UUID,
    post_update: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update post (owner only, authenticated users only)"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Only authenticated users can update posts, and only their own
    if not post.user_id or post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )
    
    if post_update.content is not None:
        post.content = post_update.content
        post.updated_at = datetime.utcnow()
        post.is_edited = True
    if post_update.tags is not None:
        post.tags = post_update.tags
        post.updated_at = datetime.utcnow()
        post.is_edited = True
    
    db.commit()
    db.refresh(post)
    return PostSchema.model_validate(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete post (owner only, authenticated users only)"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Only authenticated users can delete posts, and only their own
    if not post.user_id or post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    db.delete(post)
    db.commit()
    return None
