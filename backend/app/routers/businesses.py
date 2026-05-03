from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os

router = APIRouter(prefix="/businesses", tags=["businesses"])


def get_headers():
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }


def get_supabase_url():
    return os.getenv("SUPABASE_URL", "")


class BusinessCreate(BaseModel):
    name: str
    google_place_id: str
    address: Optional[str] = None
    google_rating: Optional[float] = None
    total_reviews: Optional[int] = 0
    user_id: str


class BusinessSearch(BaseModel):
    query: str
    location: Optional[str] = None


@router.post("/search")
async def search_business(data: BusinessSearch):
    from app.services.google_places import search_business
    results = await search_business(data.query, data.location)
    return {"results": results}


@router.get("/place/{place_id}")
async def get_place(place_id: str):
    from app.services.google_places import get_place_details
    result = await get_place_details(place_id)
    if not result:
        raise HTTPException(status_code=404, detail="Place not found")
    return result


@router.post("/")
async def create_business(data: BusinessCreate):
    url = get_supabase_url()
    headers = get_headers()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{url}/rest/v1/businesses",
            headers=headers,
            json={
                "user_id": data.user_id,
                "name": data.name,
                "google_place_id": data.google_place_id,
                "address": data.address,
                "google_rating": data.google_rating,
                "total_reviews": data.total_reviews
            }
        )
        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to create business: {response.text}"
            )
        return {"message": "Business created successfully"}


@router.get("/user/{user_id}")
async def get_user_businesses(user_id: str):
    url = get_supabase_url()
    headers = get_headers()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{url}/rest/v1/businesses?user_id=eq.{user_id}&select=*",
            headers=headers
        )
        return response.json()