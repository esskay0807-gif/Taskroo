"""Minimal Razorpay REST client (test mode) using httpx + hmac.

Avoids a new dependency. Covers the escrow flow: create order (manual capture),
capture payment, and verify the checkout handshake + webhook signatures.
"""

import hashlib
import hmac

import httpx

from app.config import Settings

RAZORPAY_API_BASE = "https://api.razorpay.com/v1"


def _auth(settings: Settings) -> tuple[str, str]:
    return (settings.razorpay_key_id, settings.razorpay_key_secret)


def create_order(settings: Settings, amount_paise: int, currency: str, receipt: str) -> dict:
    """Create an order with manual capture (payment_capture=0) so funds are only
    authorized/held until we explicitly capture on completion."""
    resp = httpx.post(
        f"{RAZORPAY_API_BASE}/orders",
        auth=_auth(settings),
        json={
            "amount": amount_paise,
            "currency": currency,
            "receipt": receipt,
            "payment_capture": 0,
        },
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()


def capture_payment(
    settings: Settings, payment_id: str, amount_paise: int, currency: str
) -> dict:
    resp = httpx.post(
        f"{RAZORPAY_API_BASE}/payments/{payment_id}/capture",
        auth=_auth(settings),
        json={"amount": amount_paise, "currency": currency},
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()


def _hmac_sha256_hex(secret: str, message: str) -> str:
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()


def verify_payment_signature(
    order_id: str, payment_id: str, signature: str, key_secret: str
) -> bool:
    """Checkout handshake: HMAC-SHA256 of "order_id|payment_id" with the key secret."""
    expected = _hmac_sha256_hex(key_secret, f"{order_id}|{payment_id}")
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(body: bytes, signature: str, webhook_secret: str) -> bool:
    """Webhook: HMAC-SHA256 of the raw request body with the webhook secret."""
    expected = hmac.new(
        webhook_secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")
