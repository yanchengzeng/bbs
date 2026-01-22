from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime
from urllib.parse import urlencode
import httpx
import logging
from app.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema
from app.services.oauth import get_google_access_token, get_google_user_info
from app.services.auth import create_access_token
from app.middleware.auth import get_current_user
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/google")
async def google_auth():
    """Initiate Google OAuth flow"""
    logger.info("Initiating Google OAuth flow")
    # Validate settings
    if not settings.google_client_id:
        logger.error("GOOGLE_CLIENT_ID is not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_CLIENT_ID is not configured"
        )
    if not settings.google_redirect_uri:
        logger.error("GOOGLE_REDIRECT_URI is not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_REDIRECT_URI is not configured"
        )
    
    # Properly encode the redirect URI
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account"
    }
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    logger.info(f"Redirecting to Google OAuth: {settings.google_redirect_uri}")
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    logger.info("Processing Google OAuth callback")
    try:
        # Exchange code for access token
        logger.debug("Exchanging authorization code for access token")
        access_token = await get_google_access_token(code)
        logger.debug("Successfully obtained access token")
        
        # Get user info from Google
        logger.debug("Fetching user info from Google")
        user_info = await get_google_user_info(access_token)
        user_email = user_info.get("email", "unknown")
        logger.info(f"Retrieved user info for email: {user_email}")
        
        # Find or create user
        user = db.query(User).filter(User.email == user_info["email"]).first()
        
        if user:
            logger.info(f"Existing user found: {user.id}")
            # Update user info
            user.name = user_info.get("name", user.name)
            # Always update avatar_url if Google provides a picture (not None or empty string)
            # This ensures avatar_url is refreshed on every login
            picture = user_info.get("picture")
            if picture and picture.strip():  # Check for non-empty string
                user.avatar_url = picture.strip()
            # If user doesn't have avatar_url and Google doesn't provide one, keep existing (None)
            user.last_login = datetime.utcnow()
            logger.debug(f"Updated user info for user {user.id}")
        else:
            logger.info(f"Creating new user for email: {user_email}")
            # Create new user
            picture = user_info.get("picture")
            user = User(
                email=user_info["email"],
                name=user_info.get("name", "User"),
                avatar_url=picture.strip() if picture and picture.strip() else None,
            )
            db.add(user)
            logger.debug("New user added to database")
        
        db.commit()
        db.refresh(user)
        logger.info(f"User {user.id} authenticated successfully")
        
        # Create JWT token
        token = create_access_token(data={"sub": str(user.id)})
        logger.debug("JWT token created")
        
        # Redirect to frontend with token
        redirect_url = f"{settings.frontend_url}/auth/callback?token={token}"
        logger.info(f"Redirecting to frontend: {settings.frontend_url}")
        return RedirectResponse(url=redirect_url)
        
    except ValueError as e:
        # Handle configuration errors
        logger.error(f"Configuration error in OAuth callback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except httpx.HTTPStatusError as e:
        # Handle HTTP errors from Google
        error_detail = f"OAuth error: {e.response.status_code}"
        logger.error(f"HTTP error from Google OAuth: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 401:
            error_detail += " - Invalid client credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_detail
        )
    except Exception as e:
        logger.error(f"Unexpected error in OAuth callback: {type(e).__name__} - {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    logger.debug(f"Fetching user info for user {current_user.id}")
    return UserSchema.model_validate(current_user)


@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    logger.info("User logout requested")
    return {"message": "Logged out successfully"}
