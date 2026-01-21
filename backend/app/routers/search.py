from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from typing import Optional
from app.database import get_db
from app.models.post import Post
from app.models.user import User
from app.schemas.post import PostWithUser
from app.schemas.user import User as UserSchema

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def search(
    q: str = Query(..., min_length=1),
    type: Optional[str] = Query("all", regex="^(posts|users|all)$"),
    db: Session = Depends(get_db)
):
    """Search posts and users"""
    results = {
        "posts": [],
        "users": []
    }
    
    if type in ("posts", "all"):
        # Search posts by content
        posts = db.query(Post).filter(
            Post.content.ilike(f"%{q}%")
        ).order_by(desc(Post.created_at)).limit(50).all()
        
        for post in posts:
            # Get like count
            like_count = db.query(func.count()).select_from(Post).join(
                Post.likes
            ).filter(Post.id == post.id).scalar() or 0
            
            post_dict = PostWithUser.model_validate(post)
            post_dict.like_count = like_count
            post_dict.is_liked = False  # Could be enhanced to check current user
            results["posts"].append(post_dict)
    
    if type in ("users", "all"):
        # Search users by name or email
        users = db.query(User).filter(
            or_(
                User.name.ilike(f"%{q}%"),
                User.email.ilike(f"%{q}%")
            )
        ).limit(20).all()
        
        results["users"] = [UserSchema.model_validate(user) for user in users]
    
    return results
