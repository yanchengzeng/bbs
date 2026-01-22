import httpx
from app.config import settings
import logging

logger = logging.getLogger(__name__)


async def get_google_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        response.raise_for_status()
        return response.json()


async def get_google_access_token(code: str) -> str:
    """Exchange authorization code for access token"""
    # Validate settings are present
    if not settings.google_client_id:
        raise ValueError("GOOGLE_CLIENT_ID is not set")
    if not settings.google_client_secret:
        raise ValueError("GOOGLE_CLIENT_SECRET is not set")
    if not settings.google_redirect_uri:
        raise ValueError("GOOGLE_REDIRECT_URI is not set")
    
    # Log client_id (first 10 chars only for security) for debugging
    client_id_preview = settings.google_client_id[:10] + "..." if len(settings.google_client_id) > 10 else settings.google_client_id
    logger.info(f"Exchanging code for token with client_id: {client_id_preview}")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            }
        )
        
        # Better error handling
        if response.status_code == 401:
            error_detail = response.text
            logger.error(f"OAuth token exchange failed: {error_detail}")
            raise ValueError(f"Invalid client credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.")
        
        response.raise_for_status()
        token_data = response.json()
        return token_data["access_token"]
