from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings

# Configure async engine for high-performance and resilient cloud database operations
connect_args = {}
# When using Supabase pooler (port 6543) or PgBouncer / Neon pooled endpoints, statement caching must be disabled:
if (
    "pooler" in settings.DATABASE_URL
    or ":6543" in settings.DATABASE_URL
    or "pgbouncer" in settings.DATABASE_URL
    or "supavisor" in settings.DATABASE_URL
):
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Proactively test connection liveliness before checkout
    pool_recycle=1800,   # Recycle connections every 30 minutes to prevent stale dropped sockets
    connect_args=connect_args,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
