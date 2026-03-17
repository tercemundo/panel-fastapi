#!/bin/bash
# Start the FastAPI backend as root so it can manage system users and packages
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"

echo "[admin-panel] Starting backend as root on port 8000..."
sudo /home/devops/fastapi/admin-panel/backend/venv/bin/uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --app-dir "$BACKEND_DIR" \
    "$@"
