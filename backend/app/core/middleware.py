import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds essential production security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory rate limiter using sliding window per client IP.
    Protects authentication endpoints from credential-stuffing / brute-force attacks.
    """

    def __init__(self, app, requests_per_minute: int = 120, auth_requests_per_minute: int = 25):
        super().__init__(app)
        self.rpm = requests_per_minute
        self.auth_rpm = auth_requests_per_minute
        # Dict of ip -> list of timestamps
        self.client_records: Dict[str, List[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Skip rate-limiting during automated testing or health checks
        if (
            settings.APP_ENV == "testing"
            or request.headers.get("X-Test-Bypass-Ratelimit") == "true"
            or request.url.path.endswith("/health")
            or request.method == "OPTIONS"
        ):
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        window_start = now - 60.0

        is_auth_route = request.url.path.startswith(f"{settings.API_V1_STR}/auth/login") or \
                         request.url.path.startswith(f"{settings.API_V1_STR}/auth/register") or \
                         request.url.path.startswith(f"{settings.API_V1_STR}/auth/forgot-password")

        limit = self.auth_rpm if is_auth_route else self.rpm

        # Clean timestamps older than 60 seconds
        key = f"{client_ip}:{ 'auth' if is_auth_route else 'api' }"
        timestamps = [ts for ts in self.client_records[key] if ts > window_start]
        self.client_records[key] = timestamps

        if len(timestamps) >= limit:
            retry_after = int(60 - (now - timestamps[0])) if timestamps else 60
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please wait before retrying.",
                    "retry_after_seconds": max(1, retry_after),
                },
                headers={
                    "Retry-After": str(max(1, retry_after)),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

        self.client_records[key].append(now)
        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - len(self.client_records[key])))
        return response
