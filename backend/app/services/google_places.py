import httpx
import os
from typing import Optional

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
BASE_URL = "https://maps.googleapis.com/maps/api"

async def search_business(query: str, location: Optional[str] = None):
    params = {
        "input": query,
        "inputtype": "textquery",
        "fields": "place_id,name,formatted_address,rating,user_ratings_total",
        "key": GOOGLE_API_KEY
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/place/findplacefromtext/json",
            params=params
        )
        data = response.json()
        return data.get("candidates", [])


async def get_place_details(place_id: str):
    params = {
        "place_id": place_id,
        "fields": "place_id,name,formatted_address,rating,user_ratings_total,website,formatted_phone_number",
        "key": GOOGLE_API_KEY
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/place/details/json",
            params=params
        )
        data = response.json()
        return data.get("result", {})


async def get_place_reviews(place_id: str):
    params = {
        "place_id": place_id,
        "fields": "reviews,rating,user_ratings_total",
        "key": GOOGLE_API_KEY,
        "reviews_sort": "newest"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/place/details/json",
            params=params
        )
        data = response.json()
        result = data.get("result", {})
        return {
            "reviews": result.get("reviews", []),
            "rating": result.get("rating"),
            "total_reviews": result.get("user_ratings_total", 0)
        }