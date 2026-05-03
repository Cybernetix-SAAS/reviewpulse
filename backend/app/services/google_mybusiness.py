import os
import httpx
from typing import Optional


def _client_id() -> str:
    return os.getenv("GOOGLE_CLIENT_ID", "")

def _client_secret() -> str:
    return os.getenv("GOOGLE_CLIENT_SECRET", "")

def _redirect_uri() -> str:
    return os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/google/callback")


def get_auth_url() -> str:
    params = {
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/business.manage",
        "access_type": "offline",
        "prompt": "consent",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"


async def exchange_code_for_token(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": _client_id(),
                "client_secret": _client_secret(),
                "redirect_uri": _redirect_uri(),
                "grant_type": "authorization_code",
            },
        )
        res.raise_for_status()
        return res.json()


async def refresh_access_token(refresh_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "refresh_token": refresh_token,
                "client_id": _client_id(),
                "client_secret": _client_secret(),
                "grant_type": "refresh_token",
            },
        )
        res.raise_for_status()
        return res.json()


async def get_accounts(access_token: str) -> list:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        res.raise_for_status()
        data = res.json()
        return data.get("accounts", [])


async def get_locations(access_token: str, account_id: str) -> list:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_id}/locations"
            "?readMask=name,title,storefrontAddress,websiteUri",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        res.raise_for_status()
        data = res.json()
        return data.get("locations", [])


async def get_reviews(access_token: str, account_id: str, location_id: str) -> list:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://mybusiness.googleapis.com/v4/{account_id}/{location_id}/reviews",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        res.raise_for_status()
        data = res.json()
        return data.get("reviews", [])


async def post_reply(
    access_token: str,
    account_id: str,
    location_id: str,
    review_id: str,
    reply_text: str,
) -> bool:
    async with httpx.AsyncClient() as client:
        res = await client.put(
            f"https://mybusiness.googleapis.com/v4/{account_id}/{location_id}/reviews/{review_id}/reply",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={"comment": reply_text},
        )
        res.raise_for_status()
        return True


async def delete_reply(
    access_token: str,
    account_id: str,
    location_id: str,
    review_id: str,
) -> bool:
    async with httpx.AsyncClient() as client:
        res = await client.delete(
            f"https://mybusiness.googleapis.com/v4/{account_id}/{location_id}/reviews/{review_id}/reply",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        res.raise_for_status()
        return True
