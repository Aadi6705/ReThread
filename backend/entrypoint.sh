#!/bin/sh
set -e

echo "[ReThread] Checking database migrations..."
alembic upgrade head || echo "[ReThread] Alembic upgrade skipped or already up to date."

echo "[ReThread] Starting application server..."
exec "$@"
