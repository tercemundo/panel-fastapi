#!/usr/bin/env bash
# ─────────────────────────────────────────────
# trabar_llaves.sh – Configura SSH passwordless
# ─────────────────────────────────────────────

set -e

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo -e "\n${YELLOW}Configurando SSH passwordless para localhost...${RESET}"

# Determinar el directorio HOME correcto
if [ "$(id -u)" -eq 0 ]; then
    SSH_DIR="/root/.ssh"
else
    SSH_DIR="$HOME/.ssh"
fi

echo -e "Directorio SSH: $SSH_DIR"

mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

if [ ! -f "$SSH_DIR/id_rsa" ]; then
    echo -e "Generando clave SSH..."
    ssh-keygen -t rsa -N "" -f "$SSH_DIR/id_rsa"
else
    echo -e "La clave SSH ya existe."
fi

if ! grep -q "$(cat "$SSH_DIR/id_rsa.pub")" "$SSH_DIR/authorized_keys" 2>/dev/null; then
    echo -e "Autorizando clave local..."
    cat "$SSH_DIR/id_rsa.pub" >> "$SSH_DIR/authorized_keys"
    chmod 600 "$SSH_DIR/authorized_keys"
else
    echo -e "La clave local ya estaba autorizada."
fi

# Añadir localhost a known_hosts
ssh-keyscan -H localhost >> "$SSH_DIR/known_hosts" 2>/dev/null

echo -e "${GREEN}Configuración SSH completada exitosamente.${RESET}\n"
