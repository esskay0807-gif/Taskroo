import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser
from app.models.user import User
from app.schemas.user import UserUpdate


def upsert_user_from_principal(db: Session, principal: CurrentUser) -> User:
    """Return the User row for the authenticated principal, creating it on first sight.

    Keyed on the Clerk subject. If the user already exists, backfill the email if we
    learned one and don't have it yet.
    """
    user = db.execute(
        select(User).where(User.clerk_id == principal.clerk_id)
    ).scalar_one_or_none()

    if user is None:
        user = User(clerk_id=principal.clerk_id, email=principal.email)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    if principal.email and user.email != principal.email:
        user.email = principal.email
        db.commit()
        db.refresh(user)

    return user


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    """Apply the provided (set) profile fields to a user and persist."""
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)
