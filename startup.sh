#!/usr/bin/env bash
# ─────────────────────────────────────────────
# startup.sh – Levanta backend (FastAPI) y
#              frontend (Vite) del admin-panel
# ─────────────────────────────────────────────

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# Colores
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}   Admin Panel – Startup Script v2     ${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# ── Backend ──────────────────────────────────
echo -e "\n${YELLOW}[1/2] Levantando Backend (FastAPI + Ansible)...${RESET}"
echo -e "      ${CYAN}→ http://localhost:8000${RESET}"

sudo "$BACKEND/venv/bin/uvicorn" main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --app-dir "$BACKEND" &

BACKEND_PID=$!
echo -e "      PID Backend: ${GREEN}$BACKEND_PID${RESET}"

# ── Frontend ─────────────────────────────────
echo -e "\n${YELLOW}[2/2] Levantando Frontend (Vite)...${RESET}"
echo -e "      ${CYAN}→ http://localhost:5173${RESET}"

# Corregir permisos de .vite/deps si fueron creados por root
if [ -d "$FRONTEND/node_modules/.vite" ]; then
    sudo chown -R "$(whoami):$(whoami)" "$FRONTEND/node_modules/.vite" 2>/dev/null || true
fi

cd "$FRONTEND"
npm run dev &

FRONTEND_PID=$!
echo -e "      PID Frontend: ${GREEN}$FRONTEND_PID${RESET}"

# ── Resumen ───────────────────────────────────
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}  Servicios corriendo:${RESET}"
echo -e "  Backend  → http://localhost:8000"
echo -e "  Frontend → http://localhost:5173"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${YELLOW}  Presiona Ctrl+C para detener ambos.${RESET}\n"

# Detener ambos con Ctrl+C
trap "echo -e '\n${YELLOW}Deteniendo servicios...${RESET}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
