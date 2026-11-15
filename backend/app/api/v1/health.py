from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def check_health(db: AsyncSession = Depends(get_db)):
    """Liveness check endpoint validating basic service response."""
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "app_name": settings.PROJECT_NAME,
        "environment": settings.APP_ENV,
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }


@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def check_readiness(db: AsyncSession = Depends(get_db)):
    """
    Readiness probe for load balancers (Vercel, Render, Kubernetes).
    Returns 200 OK only if database query succeeds; otherwise returns 503 Service Unavailable.
    """
    try:
        await db.execute(text("SELECT 1"))
        return {
            "ready": True,
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection unavailable: {exc}"
        )
