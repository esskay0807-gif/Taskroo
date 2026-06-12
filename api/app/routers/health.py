from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness check — proves the app is up. No DB dependency."""
    return {"status": "ok"}
