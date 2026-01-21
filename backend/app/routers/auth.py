from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema
from app.services.oauth import get_google_access_token, get_google_user_info
from app.services.auth import create_access_token
from app.middleware.auth import get_current_user
from app.config import settings

router = APIRouter()


@router.get("/google")
async def google_auth():
    """Initiate Google OAuth flow"""
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.google_client_id}&"
        f"redirect_uri={settings.google_redirect_uri}&"
        "response_type=code&"
        "scope=openid email profile"
    )
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for access token
        access_token = await get_google_access_token(code)
        
        # Get user info from Google
        user_info = await get_google_user_info(access_token)
        
        # Find or create user
        user = db.query(User).filter(User.email == user_info["email"]).first()
        
        if user:
            # Update user info
            user.name = user_info.get("name", user.name)
            # Always update avatar_url if Google provides a picture (not None or empty string)
            # This ensures avatar_url is refreshed on every login
            picture = user_info.get("picture")
            if picture and picture.strip():  # Check for non-empty string
                user.avatar_url = picture.strip()
            # If user doesn't have avatar_url and Google doesn't provide one, keep existing (None)
            user.last_login = datetime.utcnow()
        else:
            # Create new user
            picture = user_info.get("picture")
            user = User(
                email=user_info["email"],
                name=user_info.get("name", "User"),
                avatar_url=picture.strip() if picture and picture.strip() else None,
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        
        # Create JWT token
        token = create_access_token(data={"sub": str(user.id)})
        
        # Redirect to frontend with token
        redirect_url = f"{settings.frontend_url}/auth/callback?token={token}"
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return UserSchema.model_validate(current_user)


@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    return {"message": "Logged out successfully"}
