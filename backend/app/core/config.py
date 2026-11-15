from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator


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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Recommended short-lived access token
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
    COOKIE_DOMAIN: str = ""  # e.g. ".rethread.in" in production for same-site cookie sharing

    # Campus Email Whitelist
    ENFORCE_COLLEGE_EMAIL_WHITELIST: bool = False
    COLLEGE_EMAIL_DOMAINS: List[str] = ["ac.in", "edu"]

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
    def validate_production_guards(self) -> "Settings":
        """Strict fail-fast guards to prevent insecure production boots."""
        if self.APP_ENV == "production":
            # 1. Reject default dev secret key
            if self.SECRET_KEY == DEV_SECRET_KEY:
                raise ValueError("Production boot rejected: Insecure default SECRET_KEY detected.")
            if len(self.SECRET_KEY) < 32:
                raise ValueError("Production boot rejected: SECRET_KEY must be at least 32 characters.")

            # 2. CORS wildcard check
            if "*" in self.ALLOWED_ORIGINS:
                raise ValueError("Production boot rejected: CORS ALLOWED_ORIGINS cannot contain wildcard '*' in production.")

            # 3. Require real Cloudinary credentials
            if self.CLOUDINARY_API_SECRET in ("dev_secret", "") or self.CLOUDINARY_API_KEY in ("dev_key", ""):
                raise ValueError("Production boot rejected: Real Cloudinary credentials are required in production.")

            # 4. Enforce campus domain whitelisting in production
            self.ENFORCE_COLLEGE_EMAIL_WHITELIST = True

        return self


settings = Settings()
