import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router

logger = logging.getLogger("rethread.main")
is_prod = settings.APP_ENV == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=None if is_prod else f"{settings.API_V1_STR}/openapi.json",
    docs_url=None if is_prod else f"{settings.API_V1_STR}/docs",
    redoc_url=None if is_prod else f"{settings.API_V1_STR}/redoc",
)

# CORS Middleware: allow localhost, vercel.app preview/production domains, and any configured origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

from app.core.middleware import SecurityHeadersMiddleware, RateLimitMiddleware, CSRFProtectionMiddleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CSRFProtectionMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=200, auth_requests_per_minute=40)

# Include API v1 endpoints under both /api/v1 and /v1 to guarantee routes match
# regardless of whether Vercel Services preserves or strips the /api prefix
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/v1")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)}"},
    )


@app.get("/")
@app.get("/api")
@app.get("/health")
@app.get("/api/health")
async def root():
    return {
        "status": "ok",
        "message": "Welcome to ReThread API",
        "documentation": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
