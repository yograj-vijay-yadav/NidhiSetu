#!/bin/sh
# NidhiSetu environment setup: backend Python deps + frontend Node deps.
# Idempotent; safe to re-run after pulling updates.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Backend dependencies"
cd backend
if [ ! -x .venv/bin/python ]; then
  if command -v uv >/dev/null 2>&1; then
    uv venv --python 3.10 .venv >/dev/null 2>&1 || uv venv .venv >/dev/null 2>&1
  else
    python3 -m venv .venv
  fi
fi
if command -v uv >/dev/null 2>&1 && [ -x .venv/bin/python ]; then
  uv pip install --python .venv/bin/python -q -r requirements.txt
else
  ./.venv/bin/python -m pip install --quiet -r requirements.txt
fi
cd "$ROOT"

echo "==> Frontend dependencies"
cd frontend
npm install --no-audit --no-fund
cd "$ROOT"

echo "==> Setup complete"