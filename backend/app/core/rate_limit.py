import time
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.config import settings
from app.core.errors import error_response


class TokenBucket:
    def __init__(self, rate: float, burst: int) -> None:
        self.rate = rate
        self.burst = burst
        self.tokens: dict[str, tuple[float, float]] = {}

    def consume(self, key: str) -> bool:
        now = time.monotonic()
        last, tokens = self.tokens.get(key, (now, self.burst))

        elapsed = now - last
        tokens = min(self.burst, tokens + elapsed * self.rate)
        self.tokens[key] = (now, tokens)

        if tokens >= 1.0:
            self.tokens[key] = (now, tokens - 1.0)
            return True
        return False


_default_bucket = TokenBucket(rate=100.0 / 60.0, burst=100)
_auth_bucket = TokenBucket(rate=10.0 / 60.0, burst=10)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"

        if request.url.path.startswith("/api/v1/auth"):
            bucket = _auth_bucket
        else:
            bucket = _default_bucket

        if not bucket.consume(client_ip):
            return error_response(429, "rate_limit_exceeded", "Too many requests. Please try again later.")

        return await call_next(request)


def register_rate_limit(app: FastAPI) -> None:
    app.add_middleware(RateLimitMiddleware)
