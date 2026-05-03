from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os

router = APIRouter(prefix="/reviews", tags=["reviews"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

headers_sb = {
    "apikey": SUPABASE_SERVICE_KEY or "",
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY or ''}",
    "Content-Type": "application/json"
}


def get_sentiment(rating: int) -> str:
    if rating >= 4:
        return "positive"
    elif rating == 3:
        return "neutral"
    else:
        return "negative"


@router.get("/sync/{business_id}")
async def sync_reviews(business_id: str):
    from app.services.google_places import get_place_reviews

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/businesses?id=eq.{business_id}&select=*",
            headers=headers_sb
        )
        businesses = res.json()
        if not businesses:
            raise HTTPException(status_code=404, detail="Business not found")

        business = businesses[0]
        place_id = business.get("google_place_id")

        if not place_id:
            raise HTTPException(status_code=400, detail="No Google Place ID")

        google_data = await get_place_reviews(place_id)
        reviews = google_data.get("reviews", [])

        saved = 0
        for review in reviews:
            review_data = {
                "business_id": business_id,
                "google_review_id": f"{place_id}_{review.get('time')}",
                "author_name": review.get("author_name"),
                "rating": review.get("rating"),
                "text": review.get("text"),
                "responded": False,
                "sentiment": get_sentiment(review.get("rating", 3))
            }

            upsert_res = await client.post(
                f"{SUPABASE_URL}/rest/v1/reviews",
                headers={**headers_sb, "Prefer": "resolution=ignore-duplicates"},
                json=review_data
            )
            if upsert_res.status_code in [200, 201]:
                saved += 1

        await client.patch(
            f"{SUPABASE_URL}/rest/v1/businesses?id=eq.{business_id}",
            headers=headers_sb,
            json={
                "google_rating": google_data.get("rating"),
                "total_reviews": google_data.get("total_reviews")
            }
        )

        return {"synced": saved, "total_from_google": len(reviews)}


@router.get("/{business_id}")
async def get_reviews(business_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/reviews?business_id=eq.{business_id}&select=*&order=created_at.desc",
            headers=headers_sb
        )
        return response.json()


class GenerateResponse(BaseModel):
    review_text: str
    rating: int
    business_name: str
    author_name: Optional[str] = "Customer"


@router.post("/generate-response")
async def generate_response(data: GenerateResponse):
    tone = "apologetic and solution-focused" if data.rating <= 2 else \
           "appreciative and warm" if data.rating >= 4 else "professional"

    prompt = f"""You are a professional business owner responding to a Google review.

Business: {data.business_name}
Customer: {data.author_name}
Rating: {data.rating}/5 stars
Review: "{data.review_text}"

Write a {tone} response that is 2-3 sentences max, feels personal and genuine,
thanks them by name, and addresses the specific feedback.

Response:"""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 150,
                "temperature": 0.7
            },
            timeout=30.0
        )
        result = response.json()
        generated = result["choices"][0]["message"]["content"].strip()
        return {"response": generated}