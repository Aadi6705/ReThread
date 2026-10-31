#!/bin/sh
set -e

echo "[ReThread] Running automated database migrations..."
alembic upgrade head

echo "[ReThread] Migrations applied successfully. Starting application server..."
exec "$@"
