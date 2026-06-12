"""Clerk JWT verification.

`get_current_user` is the FastAPI dependency that protects endpoints. It either:
  - returns a synthetic dev user when DEV_AUTH_BYPASS is on (local convenience), or
  - verifies the incoming `Authorization: Bearer <token>` against Clerk's JWKS.

On any failure (missing/invalid/expired token) it raises 401.
"""

from dataclasses import dataclass

import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt import PyJWKClient

from app.config import Settings, get_settings


@dataclass
class CurrentUser:
    """The authenticated principal derived from a verified token."""

    clerk_id: str  # the `sub` claim
    email: str | None
    claims: dict


# Cache one JWKS client per process so we don't refetch keys on every request.
_jwks_client: PyJWKClient | None = None


def _get_jwks_client(jwks_url: str) -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


def _extract_email(claims: dict) -> str | None:
    # Clerk session tokens may carry email under a few keys depending on JWT template.
    return claims.get("email") or claims.get("email_address")


def get_current_user(
    authorization: str | None = Header(default=None),
    x_dev_user: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if settings.dev_auth_bypass:
        # Optional X-Dev-User header lets local testing simulate multiple identities
        # (e.g. a poster vs. a tasker). Defaults to "dev_user".
        dev_id = (x_dev_user or "dev_user").strip() or "dev_user"
        email = f"{dev_id}@taskmarket.test"
        return CurrentUser(
            clerk_id=dev_id,
            email=email,
            claims={"sub": dev_id, "email": email, "dev": True},
        )

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()

    if not settings.clerk_jwks_url:
        # Misconfiguration: real verification requested but no JWKS configured.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clerk JWKS URL is not configured (set CLERK_JWKS_URL)",
        )

    try:
        signing_key = _get_jwks_client(settings.clerk_jwks_url).get_signing_key_from_jwt(token)
        decode_kwargs: dict = {
            "algorithms": ["RS256"],
            "issuer": settings.clerk_issuer or None,
        }
        if settings.clerk_audience:
            decode_kwargs["audience"] = settings.clerk_audience
        else:
            decode_kwargs["options"] = {"verify_aud": False}

        claims = jwt.decode(token, signing_key.key, **decode_kwargs)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    sub = claims.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject (sub) claim",
        )

    return CurrentUser(clerk_id=sub, email=_extract_email(claims), claims=claims)
