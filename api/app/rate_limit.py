"""Basic in-memory fixed-window rate limiting for write requests.

Implemented as pure ASGI middleware (it never wraps receive/send), which avoids the
exception- and body-stream pitfalls of Starlette's BaseHTTPMiddleware. Single-instance
only (state lives in process memory) — production should back this with Redis. Webhooks
are exempt so providers aren't throttled.
"""

import hashlib
import json
import time

from starlette.types import ASGIApp, Receive, Scope, Send

WRITE_METHODS = {"POST", "PATCH", "PUT", "DELETE"}
EXEMPT_PREFIXES = ("/v1/webhooks/",)


def _identity(headers: dict[bytes, bytes], client: tuple | None) -> str:
    dev_user = headers.get(b"x-dev-user")
    if dev_user:
        return f"dev:{dev_user.decode()}"
    auth = headers.get(b"authorization")
    if auth:
        return "tok:" + hashlib.sha256(auth).hexdigest()[:16]
    host = client[0] if client else "unknown"
    return f"ip:{host}"


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp, limit_per_minute: int) -> None:
        self.app = app
        self.limit = limit_per_minute
        self.window = 60
        # key -> (window_start_epoch, count)
        self._buckets: dict[str, tuple[int, int]] = {}

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope["method"]
        path = scope["path"]
        if method not in WRITE_METHODS or path.startswith(EXEMPT_PREFIXES):
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        now = int(time.time())
        window_start = now - (now % self.window)
        key = f"{_identity(headers, scope.get('client'))}:{method}"
        start, count = self._buckets.get(key, (window_start, 0))
        if start != window_start:
            start, count = window_start, 0
        count += 1
        self._buckets[key] = (start, count)

        if count > self.limit:
            retry_after = self.window - (now % self.window)
            body = json.dumps(
                {"detail": "Rate limit exceeded. Please slow down."}
            ).encode()
            await send(
                {
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"retry-after", str(retry_after).encode()),
                    ],
                }
            )
            await send({"type": "http.response.body", "body": body})
            return

        await self.app(scope, receive, send)
