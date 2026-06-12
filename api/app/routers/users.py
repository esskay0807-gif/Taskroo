import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.user import PublicUserOut
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
    return PublicUserOut.model_validate(user)
