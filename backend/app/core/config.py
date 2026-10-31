from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_ENV: str = "development"
    PROJECT_NAME: str = "ReThread Backend API"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "rethread_dev_super_secret_key_change_in_production_1234567890"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://white_w6lf@localhost:5432/rethread"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://white_w6lf@localhost:5432/rethread"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    # Campus Email Whitelist
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


settings = Settings()
