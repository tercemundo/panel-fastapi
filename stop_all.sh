#!/usr/bin/env bash
# ─────────────────────────────────────────────
# stop_all.sh – Detiene backend (uvicorn) y
#               frontend (vite)
# ─────────────────────────────────────────────

# Colores
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}   Admin Panel – Deteniendo Servicios  ${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

echo -e "\n${YELLOW}[1/2] Deteniendo Backend (Uvicorn)...${RESET}"
if pgrep -f "uvicorn" > /dev/null; then
    sudo pkill -f "uvicorn"
    echo -e "      ${GREEN}✅ Uvicorn detenido.${RESET}"
else
    echo -e "      ${YELLOW}⚠️ Uvicorn no estaba corriendo.${RESET}"
fi

echo -e "\n${YELLOW}[2/2] Deteniendo Frontend (Vite/Node)...${RESET}"
if pgrep -f "vite" > /dev/null || pgrep -f "npm run dev" > /dev/null; then
    sudo pkill -f "vite" 2>/dev/null || true
    sudo pkill -f "npm run dev" 2>/dev/null || true
    echo -e "      ${GREEN}✅ Vite y npm dev detenidos.${RESET}"
else
    echo -e "      ${YELLOW}⚠️ Vite no estaba corriendo.${RESET}"
fi

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}  Todos los servicios detenidos.${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
