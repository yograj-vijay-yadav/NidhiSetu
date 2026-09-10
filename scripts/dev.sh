#!/bin/sh
# Start FastAPI backend (port 8000) and Next.js frontend (PORT / 3000).
# The frontend proxies /api/* to the backend via next.config rewrites, so the
# browser only talks to a single origin.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${PORT:-3000}"

echo "==> Starting NidhiSetu backend on 0.0.0.0:${BACKEND_PORT}"
(cd "$ROOT/backend" && exec ./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT") &
BACKEND_PID=$!

trap 'kill $BACKEND_PID 2>/dev/null || true' EXIT INT TERM

echo "==> Starting NidhiSetu frontend on 0.0.0.0:${FRONTEND_PORT}"
cd "$ROOT/frontend"
exec npx next dev -p "$FRONTEND_PORT" -H 0.0.0.0