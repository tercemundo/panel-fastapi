#!/usr/bin/env bash
# ─────────────────────────────────────────────
# startup.sh – Levanta backend (FastAPI) y
#              frontend (Vite) del admin-panel
# ─────────────────────────────────────────────

set -e

# ── Node.js 22 Installation ──────────────────
echo -e "\n\033[1;33mInstalando Node.js 22 y dependencias del sistema...\033[0m"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs ansible sshpass
node -v
npm -v

BACKEND="./backend"
FRONTEND="./frontend"

# Colores
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}   Admin Panel – Startup Script v2     ${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# ── Configuración SSH ────────────────────────
./trabar_llaves.sh

# ── Backend ──────────────────────────────────
echo -e "\n${YELLOW}Instalando dependencias del Backend...${RESET}"
cd "$BACKEND"
if [ ! -f "venv/bin/activate" ]; then
    echo -e "Creando entorno virtual..."
    rm -rf venv 2>/dev/null || true
    if ! python3 -m venv venv; then
        echo -e "\n${YELLOW}Falta paquete python3-venv. Instalando vía apt...${RESET}"
        sudo apt-get update
        sudo apt-get install -y python3-venv python3.12-venv
        rm -rf venv 2>/dev/null || true
        python3 -m venv venv
    fi
fi
./venv/bin/pip install -r requirements.txt
cd ..

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
echo -e "\n${YELLOW}Instalando dependencias del Frontend...${RESET}"
cd "$FRONTEND"
npm install
cd ..

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
