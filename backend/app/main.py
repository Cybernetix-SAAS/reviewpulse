from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.routers import businesses, reviews, google_auth

load_dotenv()

app = FastAPI(title="ReviewPulse API", version="1.0.0")

_extra = [o.strip() for o in os.getenv("FRONTEND_URL", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        *_extra,
    ],
    allow_origin_regex=r"https://(.*\.vercel\.app|.*\.railway\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(businesses.router)
app.include_router(reviews.router)
app.include_router(google_auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ReviewPulse API"}