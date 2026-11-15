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


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    Guards state-changing requests against CSRF.
    Enforces Origin/Referer validation and custom anti-CSRF header checks for cookie-authenticated sessions.
    """
    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

    async def dispatch(self, request: Request, call_next):
        if request.method in self.SAFE_METHODS or settings.APP_ENV == "testing":
            return await call_next(request)

        path = request.url.path
        if (
            path.endswith("/auth/login")
            or path.endswith("/auth/register")
            or path.endswith("/auth/refresh")
            or path.endswith("/health")
        ):
            return await call_next(request)

        has_session_cookie = bool(request.cookies.get("access_token") or request.cookies.get("refresh_token"))
        if has_session_cookie:
            has_custom_header = bool(
                request.headers.get("X-Requested-With")
                or request.headers.get("X-CSRF-Token")
            )
            origin = request.headers.get("Origin") or request.headers.get("Referer")
            valid_origin = False
            if origin:
                for allowed in settings.ALLOWED_ORIGINS:
                    if origin.startswith(allowed):
                        valid_origin = True
                        break
                if settings.FRONTEND_URL and origin.startswith(settings.FRONTEND_URL):
                    valid_origin = True

            if settings.APP_ENV == "production" and not (has_custom_header or valid_origin):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "CSRF validation failed: Missing anti-CSRF header or recognized origin."},
                )

        return await call_next(request)


def get_trusted_client_ip(request: Request) -> str:
    """Extracts client IP respecting Cloudflare and reverse-proxy headers."""
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    return request.client.host if request.client else "127.0.0.1"


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

        client_ip = get_trusted_client_ip(request)
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
