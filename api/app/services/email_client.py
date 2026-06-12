"""Transactional email via Resend (httpx). Best-effort: failures are swallowed so they
never break the originating request. When RESEND_API_KEY is unset, emails are logged."""

import logging

import httpx

from app.config import Settings

logger = logging.getLogger("taskmarket.email")

RESEND_API_URL = "https://api.resend.com/emails"


def send_email(settings: Settings, to: str | None, subject: str, html: str) -> None:
    if not to:
        return
    if not settings.resend_configured:
        logger.info("[email:dev] to=%s subject=%s", to, subject)
        return
    try:
        httpx.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.resend_from,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        ).raise_for_status()
    except Exception as exc:  # noqa: BLE001 — email is best-effort
        logger.warning("Failed to send email to %s: %s", to, exc)
