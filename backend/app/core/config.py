import json
import logging
import secrets
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator, model_validator

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
    PORT: int = 8000

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
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    COOKIE_DOMAIN: str = ""

    # Campus Email Configuration (permits any standard email by default for student accessibility)
    ENFORCE_COLLEGE_EMAIL_WHITELIST: bool = False
    COLLEGE_EMAIL_DOMAINS: Union[List[str], str] = ["ac.in", "edu", "gmail.com", "outlook.com", "yahoo.com"]

    @field_validator("ALLOWED_ORIGINS", "COLLEGE_EMAIL_DOMAINS", mode="before")
    @classmethod
    def parse_comma_separated(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

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
        import os

        # Check alternative common env var names if DATABASE_URL is still pointing to default localhost
        if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
            for alt_key in ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "SUPABASE_DATABASE_URL", "DB_URL"]:
                val = os.getenv(alt_key)
                if val and "localhost" not in val and "127.0.0.1" not in val:
                    self.DATABASE_URL = val
                    break

        # 1. Normalize asyncpg DATABASE_URL
        db_url = self.DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Ensure SSL requirement for cloud Supabase pooler/direct connections
        if "supabase" in db_url and "ssl" not in db_url:
            db_url += ("&" if "?" in db_url else "?") + "ssl=require"
        self.DATABASE_URL = db_url

        # 2. Normalize SYNC_DATABASE_URL (psycopg2 requires sslmode, not ssl)
        sync_url = self.SYNC_DATABASE_URL
        if "localhost" in sync_url and "localhost" not in self.DATABASE_URL:
            sync_url = self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        if sync_url.startswith("postgres://"):
            sync_url = sync_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif sync_url.startswith("postgresql://") and "+psycopg2" not in sync_url:
            sync_url = sync_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        if "ssl=require" in sync_url:
            sync_url = sync_url.replace("ssl=require", "sslmode=require")
        elif "supabase" in sync_url and "sslmode" not in sync_url:
            sync_url += ("&" if "?" in sync_url else "?") + "sslmode=require"
        self.SYNC_DATABASE_URL = sync_url

        # 3. CORS origins dynamic sync
        if self.FRONTEND_URL and self.FRONTEND_URL not in self.ALLOWED_ORIGINS:
            self.ALLOWED_ORIGINS.append(self.FRONTEND_URL)

        # 4. Production resilience: auto-generate secure secret if default
        if self.APP_ENV == "production" and (self.SECRET_KEY == DEV_SECRET_KEY or len(self.SECRET_KEY) < 32):
            logger.warning("Insecure dev SECRET_KEY detected in production. Auto-generating secure key.")
            self.SECRET_KEY = secrets.token_hex(32)

        return self


settings = Settings()
