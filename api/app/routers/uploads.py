import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import FileResponse

from app.auth.clerk import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.schemas.user import PresignRequest, PresignResponse
from app.services.storage_service import dev_upload_path, presign_upload

router = APIRouter(tags=["uploads"])


@router.post("/uploads/presign", response_model=PresignResponse)
def presign_upload(
    payload: PresignRequest,
    principal: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> PresignResponse:
    """Return a presigned URL to upload a file (R2, or a local dev fallback)."""
    return presign_upload(
        settings, payload.kind, principal.clerk_id, payload.filename, payload.content_type
    )


# --- Dev fallback storage (only used when R2 is not configured) ---


@router.put("/uploads/dev/{key:path}")
async def dev_upload_put(
    key: str,
    request: Request,
    settings: Settings = Depends(get_settings),
) -> Response:
    if settings.r2_configured:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    try:
        path = dev_upload_path(key)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid key")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    body = await request.body()
    with open(path, "wb") as f:
        f.write(body)
    return Response(status_code=status.HTTP_200_OK)


@router.get("/uploads/dev/{key:path}")
def dev_upload_get(
    key: str,
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    if settings.r2_configured:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    try:
        path = dev_upload_path(key)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid key")
    if not os.path.isfile(path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return FileResponse(path)
