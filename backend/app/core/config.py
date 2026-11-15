import logging
import secrets
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator

logger = logging.getLogger("rethread.config")

DEV_SECRET_KEY = "rethread_dev_super_secret_key_change_in_production_1234567890"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_ENV: str = "development"  # development, staging, production
    PROJECT_NAME: str = "ReThread Backend API"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = DEV_SECRET_KEY
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://white_w6lf@localhost:5432/rethread"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://white_w6lf@localhost:5432/rethread"

    # CORS & Domain
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    COOKIE_DOMAIN: str = ""

    # Campus Email Configuration (permits any standard email by default for student accessibility)
    ENFORCE_COLLEGE_EMAIL_WHITELIST: bool = False
    COLLEGE_EMAIL_DOMAINS: List[str] = ["ac.in", "edu", "gmail.com", "outlook.com", "yahoo.com"]

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = "rethread-dev"
    CLOUDINARY_API_KEY: str = "dev_key"
    CLOUDINARY_API_SECRET: str = "dev_secret"

    # SMTP Email
    EMAIL_HOST: str = "localhost"
    EMAIL_PORT: int = 1025
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = "ReThread Campus <noreply@rethread.campus>"

    @model_validator(mode="after")
    def normalize_and_guard(self) -> "Settings":
        # 1. Normalize asyncpg DATABASE_URL
        db_url = self.DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        self.DATABASE_URL = db_url

        # 2. Normalize SYNC_DATABASE_URL
        sync_url = self.SYNC_DATABASE_URL
        if sync_url.startswith("postgres://"):
            sync_url = sync_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif sync_url.startswith("postgresql://") and "+psycopg2" not in sync_url:
            sync_url = sync_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        self.SYNC_DATABASE_URL = sync_url

        # 3. Production resilience: auto-generate secure secret if default
        if self.APP_ENV == "production" and (self.SECRET_KEY == DEV_SECRET_KEY or len(self.SECRET_KEY) < 32):
            logger.warning("Insecure dev SECRET_KEY detected in production. Auto-generating secure key.")
            self.SECRET_KEY = secrets.token_hex(32)

        return self


settings = Settings()
