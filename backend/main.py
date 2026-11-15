"""
Entry point for Vercel Serverless / Vercel Services.
Exposes the FastAPI application instance `app`.
"""
from app.main import app

__all__ = ["app"]

