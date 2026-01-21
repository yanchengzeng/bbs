import httpx
from app.config import settings


async def get_google_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        response.raise_for_status()
        return response.json()


async def get_google_access_token(code: str) -> str:
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
        response.raise_for_status()
        token_data = response.json()
        return token_data["access_token"]
