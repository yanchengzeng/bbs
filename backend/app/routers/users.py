from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from uuid import UUID
from datetime import datetime, timedelta
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.like import Like
from app.schemas.user import User as UserSchema, UserUpdate
from app.schemas.post import PostWithUser
from app.schemas.comment import CommentWithUser
from app.middleware.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserSchema])
async def get_users(
    db: Session = Depends(get_db)
):
    """Get all users"""
    users = db.query(User).order_by(User.name).all()
    return [UserSchema.model_validate(user) for user in users]


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """Get user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserSchema.model_validate(user)


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user profile (owner only)"""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    
    db.commit()
    db.refresh(current_user)
    return UserSchema.model_validate(current_user)


@router.get("/{user_id}/posts", response_model=list[PostWithUser])
async def get_user_posts(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user)
):
    """Get posts by user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    posts = db.query(Post).filter(Post.user_id == user_id).order_by(desc(Post.created_at)).all()
    
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


class WeeklySummaryItem(BaseModel):
    tag: str
    count: int
    posts: List[PostWithUser] = []


@router.get("/{user_id}/weekly-summary", response_model=List[WeeklySummaryItem])
async def get_weekly_summary(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user)
):
    """Get weekly summary of user's posts grouped by tags"""
    import re
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Calculate date range for this week (last 7 days)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)
    
    # Get posts from this week
    posts = db.query(Post).filter(
        Post.user_id == user_id,
        Post.created_at >= start_date,
        Post.created_at <= end_date
    ).all()
    
    # Preset tags to look for
    preset_tags = ['#gettingup', '#running', '#reading']
    
    # Group posts by tag
    tag_posts: dict[str, list[Post]] = {}
    other_posts: list[Post] = []
    processed_posts = set()  # Track which posts have been added to a category
    
    for post in posts:
        tags = post.tags or []
        
        if tags:
            # Check if post has any preset tags
            has_preset_tag = False
            for tag in tags:
                if tag in preset_tags:
                    has_preset_tag = True
                    if tag not in tag_posts:
                        tag_posts[tag] = []
                    if post.id not in processed_posts:
                        tag_posts[tag].append(post)
                        processed_posts.add(post.id)
            
            # If post has tags but none are preset tags, add to "other"
            if not has_preset_tag and post.id not in processed_posts:
                other_posts.append(post)
                processed_posts.add(post.id)
        else:
            # Posts without tags go to "other"
            if post.id not in processed_posts:
                other_posts.append(post)
                processed_posts.add(post.id)
    
    # Build result with posts
    result = []
    
    # Add tagged categories
    for tag in preset_tags:
        if tag in tag_posts:
            tag_post_list = tag_posts[tag]
            # Convert posts to PostWithUser format
            posts_with_user = []
            for post in tag_post_list:
                # Get like count
                like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
                # Check if current user liked this post
                is_liked = False
                if current_user:
                    is_liked = db.query(Like).filter(
                        Like.post_id == post.id,
                        Like.user_id == current_user.id
                    ).first() is not None
                # Get comments
                comments_with_user = []
                for comment in post.comments:
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
                posts_with_user.append(post_dict)
            
            result.append(WeeklySummaryItem(
                tag=tag,
                count=len(tag_post_list),
                posts=posts_with_user
            ))
    
    # Add "other" category if there are posts without tags
    if other_posts:
        other_posts_with_user = []
        for post in other_posts:
            like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
            is_liked = False
            if current_user:
                is_liked = db.query(Like).filter(
                    Like.post_id == post.id,
                    Like.user_id == current_user.id
                ).first() is not None
            comments_with_user = []
            for comment in post.comments:
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
            other_posts_with_user.append(post_dict)
        
        result.append(WeeklySummaryItem(
            tag='other',
            count=len(other_posts),
            posts=other_posts_with_user
        ))
    
    # Sort by count (descending)
    result.sort(key=lambda x: x.count, reverse=True)
    
    return result


def build_weekly_summary_for_range(
    posts: list[Post],
    preset_tags: list[str],
    db: Session,
    current_user: User | None
) -> List[WeeklySummaryItem]:
    """Helper function to build weekly summary for a date range"""
    # Group posts by tag
    tag_posts: dict[str, list[Post]] = {}
    other_posts: list[Post] = []
    processed_posts = set()
    
    for post in posts:
        tags = post.tags or []
        
        if tags:
            has_preset_tag = False
            for tag in tags:
                if tag in preset_tags:
                    has_preset_tag = True
                    if tag not in tag_posts:
                        tag_posts[tag] = []
                    if post.id not in processed_posts:
                        tag_posts[tag].append(post)
                        processed_posts.add(post.id)
            
            if not has_preset_tag and post.id not in processed_posts:
                other_posts.append(post)
                processed_posts.add(post.id)
        else:
            if post.id not in processed_posts:
                other_posts.append(post)
                processed_posts.add(post.id)
    
    result = []
    preset_tags_list = preset_tags
    
    # Add tagged categories
    for tag in preset_tags_list:
        if tag in tag_posts:
            tag_post_list = tag_posts[tag]
            posts_with_user = []
            for post in tag_post_list:
                like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
                is_liked = False
                if current_user:
                    is_liked = db.query(Like).filter(
                        Like.post_id == post.id,
                        Like.user_id == current_user.id
                    ).first() is not None
                comments_with_user = []
                for comment in post.comments:
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
                posts_with_user.append(post_dict)
            
            result.append(WeeklySummaryItem(
                tag=tag,
                count=len(tag_post_list),
                posts=posts_with_user
            ))
    
    # Add "other" category
    if other_posts:
        other_posts_with_user = []
        for post in other_posts:
            like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
            is_liked = False
            if current_user:
                is_liked = db.query(Like).filter(
                    Like.post_id == post.id,
                    Like.user_id == current_user.id
                ).first() is not None
            comments_with_user = []
            for comment in post.comments:
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
            other_posts_with_user.append(post_dict)
        
        result.append(WeeklySummaryItem(
            tag='other',
            count=len(other_posts),
            posts=other_posts_with_user
        ))
    
    result.sort(key=lambda x: x.count, reverse=True)
    return result


class WeeklyReport(BaseModel):
    week_start: str
    week_end: str
    categories: List[WeeklySummaryItem]


@router.get("/{user_id}/weekly-reports", response_model=List[WeeklyReport])
async def get_weekly_reports(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
    weeks: int = Query(4, ge=1, le=12)  # Number of weeks to return, default 4
):
    """Get weekly reports for multiple weeks, sorted by week range"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    preset_tags = ['#gettingup', '#running', '#reading']
    reports = []
    
    # Get reports for the last N weeks
    today = datetime.utcnow()
    for week_offset in range(weeks):
        # Calculate week range (Monday to Sunday)
        days_since_monday = today.weekday()
        week_start_date = today - timedelta(days=days_since_monday + 7 * week_offset)
        week_start_date = week_start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end_date = week_start_date + timedelta(days=6, hours=23, minutes=59, seconds=59)
        
        # Get posts for this week
        week_posts = db.query(Post).filter(
            Post.user_id == user_id,
            Post.created_at >= week_start_date,
            Post.created_at <= week_end_date
        ).all()
        
        if week_posts:
            categories = build_weekly_summary_for_range(week_posts, preset_tags, db, current_user)
            if categories:  # Only add if there are categories
                reports.append(WeeklyReport(
                    week_start=week_start_date.isoformat(),
                    week_end=week_end_date.isoformat(),
                    categories=categories
                ))
    
    return reports
