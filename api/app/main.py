from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.rate_limit import RateLimitMiddleware
from app.routers import (
    categories,
    conversations,
    health,
    me,
    notifications,
    offers,
    payments,
    reviews,
    tasks,
    uploads,
    users,
)

settings = get_settings()

app = FastAPI(title="TaskMarket API", version="0.1.0")

# Rate limiting runs before CORS so 429s still carry CORS headers (middleware added
# later wraps earlier ones).
app.add_middleware(RateLimitMiddleware, limit_per_minute=settings.rate_limit_per_minute)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Everything is versioned under /v1 from day one.
v1 = APIRouter(prefix="/v1")
v1.include_router(health.router)
v1.include_router(me.router)
v1.include_router(users.router)
v1.include_router(uploads.router)
v1.include_router(categories.router)
v1.include_router(tasks.router)
v1.include_router(offers.router)
v1.include_router(conversations.router)
v1.include_router(payments.router)
v1.include_router(reviews.router)
v1.include_router(notifications.router)
app.include_router(v1)
