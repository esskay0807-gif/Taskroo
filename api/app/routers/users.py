import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.tasker_service import TaskerServiceOut
from app.schemas.user import PublicUserOut
from app.services import service_listing_service
from app.services.user_service import get_user_by_id

router = APIRouter(tags=["users"])


@router.get("/users/{user_id}", response_model=PublicUserOut)
def get_public_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> PublicUserOut:
    """Public profile for any user. No auth required; omits private fields."""
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    out = PublicUserOut.model_validate(user)
    services = service_listing_service.list_for_tasker(db, user.id, active_only=True)
    return out.model_copy(
        update={"services": [TaskerServiceOut.model_validate(s) for s in services]}
    )
