from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.db import get_db
from app.schemas.user import UserOut, UserUpdate
from app.services.user_service import update_user, upsert_user_from_principal

router = APIRouter(tags=["me"])


@router.get("/me", response_model=UserOut)
def read_me(
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Return the authenticated user, upserting the row on first call."""
    user = upsert_user_from_principal(db, principal)
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Edit the authenticated user's profile."""
    user = upsert_user_from_principal(db, principal)
    user = update_user(db, user, payload)
    return UserOut.model_validate(user)
