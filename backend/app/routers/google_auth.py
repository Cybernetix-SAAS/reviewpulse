from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import httpx
import os
from datetime import datetime, timezone, timedelta

from app.services.google_mybusiness import (
    get_auth_url,
    exchange_code_for_token,
    refresh_access_token,
    get_accounts,
    get_locations,
    get_reviews,
    post_reply,
)

router = APIRouter(prefix="/google", tags=["google"])


def get_supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "")


def get_headers() -> dict:
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


class CallbackRequest(BaseModel):
    code: str
    user_id: str


class PostReplyRequest(BaseModel):
    review_id: str
    reply_text: str
    user_id: str


async def _get_connection(user_id: str) -> Optional[dict]:
    url = get_supabase_url()
    headers = get_headers()
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{url}/rest/v1/google_connections?user_id=eq.{user_id}&select=*&limit=1",
            headers=headers,
        )
        data = res.json()
        return data[0] if data else None


async def _get_valid_token(conn: dict) -> str:
    expiry = conn.get("token_expiry")
    needs_refresh = True
    if expiry:
        exp_dt = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
        needs_refresh = exp_dt <= datetime.now(timezone.utc) + timedelta(minutes=5)

    if not needs_refresh:
        return conn["access_token"]

    refresh = conn.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=401, detail="Google token expired and no refresh token")

    tokens = await refresh_access_token(refresh)
    new_token = tokens.get("access_token")
    new_expiry = (datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))).isoformat()

    url = get_supabase_url()
    headers = get_headers()
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{url}/rest/v1/google_connections?user_id=eq.{conn['user_id']}",
            headers=headers,
            json={"access_token": new_token, "token_expiry": new_expiry},
        )

    return new_token


@router.get("/auth-url")
async def get_google_auth_url():
    return {"auth_url": get_auth_url()}


@router.post("/callback")
async def google_callback(data: CallbackRequest):
    try:
        tokens = await exchange_code_for_token(data.code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {e}")

    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)
    expiry = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()

    url = get_supabase_url()
    headers = get_headers()

    async with httpx.AsyncClient() as client:
        existing = await client.get(
            f"{url}/rest/v1/google_connections?user_id=eq.{data.user_id}&select=id&limit=1",
            headers=headers,
        )
        rows = existing.json()

        payload = {
            "user_id": data.user_id,
            "access_token": access_token,
            "token_expiry": expiry,
        }
        if refresh_token:
            payload["refresh_token"] = refresh_token

        if rows:
            await client.patch(
                f"{url}/rest/v1/google_connections?user_id=eq.{data.user_id}",
                headers=headers,
                json=payload,
            )
        else:
            await client.post(
                f"{url}/rest/v1/google_connections",
                headers=headers,
                json=payload,
            )

    return {"status": "connected"}


@router.get("/status")
async def google_status(user_id: str):
    conn = await _get_connection(user_id)
    return {"connected": conn is not None}


@router.delete("/disconnect")
async def google_disconnect(user_id: str):
    url = get_supabase_url()
    headers = get_headers()
    async with httpx.AsyncClient() as client:
        await client.delete(
            f"{url}/rest/v1/google_connections?user_id=eq.{user_id}",
            headers=headers,
        )
    return {"status": "disconnected"}


@router.get("/accounts")
async def google_accounts(user_id: str):
    conn = await _get_connection(user_id)
    if not conn:
        raise HTTPException(status_code=401, detail="Google not connected")
    token = await _get_valid_token(conn)
    try:
        accounts = await get_accounts(token)
        return {"accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/locations/{account_id}")
async def google_locations(account_id: str, user_id: str):
    conn = await _get_connection(user_id)
    if not conn:
        raise HTTPException(status_code=401, detail="Google not connected")
    token = await _get_valid_token(conn)
    try:
        locations = await get_locations(token, account_id)
        return {"locations": locations}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sync-reviews/{location_id}")
async def sync_gmb_reviews(location_id: str, user_id: str, account_id: str):
    conn = await _get_connection(user_id)
    if not conn:
        raise HTTPException(status_code=401, detail="Google not connected")
    token = await _get_valid_token(conn)

    try:
        reviews = await get_reviews(token, account_id, location_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    url = get_supabase_url()
    headers = get_headers()

    async with httpx.AsyncClient() as client:
        biz_res = await client.get(
            f"{url}/rest/v1/businesses?gmb_location_id=eq.{location_id}&user_id=eq.{user_id}&select=id&limit=1",
            headers=headers,
        )
        biz = biz_res.json()
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found for this location")
        business_id = biz[0]["id"]

        saved = 0
        for r in reviews:
            name = r.get("reviewId", "")
            rating_map = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}
            rating = rating_map.get(r.get("starRating", "THREE"), 3)
            sentiment = "positive" if rating >= 4 else "neutral" if rating == 3 else "negative"

            review_data = {
                "business_id": business_id,
                "google_review_id": name,
                "gmb_review_id": name,
                "author_name": r.get("reviewer", {}).get("displayName"),
                "rating": rating,
                "text": r.get("comment", ""),
                "responded": bool(r.get("reviewReply")),
                "sentiment": sentiment,
            }

            upsert_res = await client.post(
                f"{url}/rest/v1/reviews",
                headers={**headers, "Prefer": "resolution=ignore-duplicates"},
                json=review_data,
            )
            if upsert_res.status_code in [200, 201]:
                saved += 1

    return {"synced": saved, "total": len(reviews)}


@router.post("/post-reply")
async def google_post_reply(data: PostReplyRequest):
    url = get_supabase_url()
    headers = get_headers()

    async with httpx.AsyncClient() as client:
        rev_res = await client.get(
            f"{url}/rest/v1/reviews?id=eq.{data.review_id}&select=*,businesses(gmb_account_id,gmb_location_id,user_id)&limit=1",
            headers=headers,
        )
        reviews = rev_res.json()
        if not reviews:
            raise HTTPException(status_code=404, detail="Review not found")

        review = reviews[0]
        biz = review.get("businesses", {})
        account_id = biz.get("gmb_account_id")
        location_id = biz.get("gmb_location_id")
        gmb_review_id = review.get("gmb_review_id") or review.get("google_review_id")

        if not account_id or not location_id or not gmb_review_id:
            raise HTTPException(status_code=400, detail="Business not connected to Google My Business. Connect via Settings > Integrations.")

        conn = await _get_connection(data.user_id)
        if not conn:
            raise HTTPException(status_code=401, detail="Google not connected")
        token = await _get_valid_token(conn)

        try:
            await post_reply(token, account_id, location_id, gmb_review_id, data.reply_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to post reply: {e}")

        now = datetime.now(timezone.utc).isoformat()
        await client.patch(
            f"{url}/rest/v1/reviews?id=eq.{data.review_id}",
            headers=headers,
            json={
                "responded": True,
                "reply_posted_to_google": True,
                "reply_posted_at": now,
                "ai_response": data.reply_text,
            },
        )

    return {"status": "posted"}
