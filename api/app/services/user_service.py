from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser
from app.models.user import User


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
