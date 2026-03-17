# 🛠️ Admin Control Panel v2

Panel de administración de sistemas Linux con **FastAPI + Ansible + React (Vite)**. Permite gestionar usuarios, instalar paquetes APT y controlar el sistema desde una interfaz web, delegando todas las operaciones al sistema operativo mediante **Ansible Playbooks**.

---

## 📐 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│          React + Vite + TailwindCSS                 │
│               http://localhost:5173                 │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (axios)
                       ▼
┌─────────────────────────────────────────────────────┐
│                    BACKEND                          │
│          FastAPI + SQLAlchemy + SQLite              │
│               http://localhost:8000                 │
│                                                     │
│  POST /users/    → run_playbook(create_user.yml)    │
│  POST /packages/ → run_playbook(install_package.yml)│
│  POST /reboot/   → run_playbook(reboot.yml)         │
│  GET  /logs/     → últimas N líneas del log         │
└──────────────────────┬──────────────────────────────┘
                       │ ansible-playbook (subprocess)
                       ▼
┌─────────────────────────────────────────────────────┐
│                   ANSIBLE                           │
│         Roles ejecutados sobre localhost            │
│                                                     │
│  manage_users      → user, chpasswd, sudoers        │
│  install_packages  → apt module                     │
│  reboot_system     → shutdown -r                    │
└─────────────────────────────────────────────────────┘
```

---

## 🧰 Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React | 18.x |
| Frontend bundler | Vite | 5.x |
| Estilos | TailwindCSS | 3.x |
| Iconos | Lucide React | 0.300 |
| HTTP Client | Axios | 1.x |
| Backend API | FastAPI | 0.115 |
| ASGI Server | Uvicorn | 0.32 |
| ORM | SQLAlchemy | 2.0 |
| Base de datos | SQLite | (archivo local) |
| Automatización | Ansible | 9.x |
| Auth hashing | Passlib + bcrypt | 1.7 / 3.2 |
| Métricas sistema | psutil | 6.x |
| YAML (python) | PyYAML | 6.x |

---

## 📁 Estructura del proyecto

```
admin-panel/
├── startup.sh                    # Script para levantar todo
├── docker-compose.yml            # (opcional) compose file
│
├── backend/
│   ├── main.py                   # API FastAPI + lógica de Ansible
│   ├── crud.py                   # Operaciones de base de datos
│   ├── models.py                 # Modelos SQLAlchemy
│   ├── schemas.py                # Esquemas Pydantic
│   ├── database.py               # Conexión SQLite
│   ├── requirements.txt          # Dependencias Python
│   ├── admin_panel.log           # Log de actividad (auto-generado)
│   ├── data/
│   │   └── admin.db              # Base de datos SQLite
│   ├── venv/                     # Entorno virtual Python
│   └── ansible/
│       ├── ansible.cfg           # Configuración de Ansible
│       ├── inventory/
│       │   └── hosts.ini         # Inventario: localhost
│       ├── create_user.yml       # Playbook: crear usuario
│       ├── install_package.yml   # Playbook: instalar paquete
│       ├── reboot.yml            # Playbook: reiniciar sistema
│       └── roles/
│           ├── manage_users/     # Role: gestión de usuarios
│           ├── install_packages/ # Role: gestión de paquetes
│           └── reboot_system/    # Role: reinicio del sistema
│
└── frontend/
    ├── src/
    │   ├── App.jsx               # Componente principal
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

---

## ✅ Requisitos previos

Antes de instalar, asegurate de tener:

- **Sistema operativo**: Linux (Ubuntu 22.04+ / Zorin OS / Debian)
- **Privilegios**: El usuario debe poder ejecutar `sudo` sin contraseña (o tener acceso root)
- **Git**: Para clonar el repositorio
- **Internet**: Para descargar dependencias

Verificá que todo esté disponible:

```bash
# Verificar Python 3.10+
python3 --version

# Verificar Node.js 18+
node --version

# Verificar npm
npm --version

# Verificar Ansible
ansible --version
```

---

## 🚀 Instalación paso a paso

### Paso 1 – Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd admin-panel
```

### Paso 2 – Instalar Ansible (si no está instalado)

```bash
sudo apt update
sudo apt install -y ansible
ansible --version   # debe mostrar ansible 9.x o superior
```

### Paso 3 – Configurar el backend Python

```bash
cd backend

# Crear entorno virtual
python3 -m venv venv

# Activar el entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Volver al directorio raíz
cd ..
```

### Paso 4 – Configurar el frontend Node.js

```bash
cd frontend

# Instalar dependencias
npm install

# Volver al directorio raíz
cd ..
```

### Paso 5 – Inicializar la base de datos

La base de datos SQLite se crea automáticamente al iniciar el servidor. No requiere configuración adicional.

Si es la primera vez, asegurate que el directorio `data/` tenga permisos correctos:

```bash
mkdir -p backend/data
chmod 755 backend/data
```

### Paso 6 – Levantar el sistema

```bash
./startup.sh
```

Esto levanta:
- **Backend** en `http://localhost:8000`
- **Frontend** en `http://localhost:5173`

Para detener ambos servicios: `Ctrl + C`

---

## 🔑 Configuración de sudoers (requerido)

El backend necesita ejecutar Ansible como root. Para evitar que pida contraseña cada vez, configurá sudoers para el usuario `devops`:

```bash
# Ejecutar como root:
echo "devops ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/devops
sudo chmod 0440 /etc/sudoers.d/devops

# Verificar que no haya errores de sintaxis:
sudo visudo -cf /etc/sudoers.d/devops
```

> ⚠️ **Atención**: Esto le da privilegios completos al usuario `devops`. En producción, restringir a los comandos específicos de Ansible.

---

## 🌐 Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/system/` | Info del sistema (disco, RAM) |
| `POST` | `/users/` | Crear usuario Linux con sudoers |
| `POST` | `/packages/` | Instalar paquete APT |
| `POST` | `/reboot/` | Reiniciar el sistema |
| `GET` | `/logs/` | Ver log de actividad |
| `GET` | `/logs/?lines=50` | Últimas 50 líneas del log |

### Ejemplos con curl

```bash
# Ver info del sistema
curl http://localhost:8000/system/

# Instalar un paquete
curl -X POST http://localhost:8000/packages/ \
  -H "Content-Type: application/json" \
  -d '{"name": "htop"}'

# Crear usuario
curl -X POST http://localhost:8000/users/ \
  -H "Content-Type: application/json" \
  -d '{"name": "juan", "password": "MiPass123", "repeat_password": "MiPass123"}'

# Ver últimas 100 líneas del log
curl http://localhost:8000/logs/?lines=100
```

---

## 📋 Playbooks de Ansible

Los playbooks están en `backend/ansible/`. Podés ejecutarlos directamente desde la terminal para testing:

```bash
cd backend/ansible

# Instalar un paquete (modo test/check, no aplica cambios):
ansible-playbook -i inventory/hosts.ini install_package.yml \
  --check --extra-vars "pkg_name=htop"

# Instalar un paquete (real):
ansible-playbook -i inventory/hosts.ini install_package.yml \
  --extra-vars "pkg_name=htop"

# Verificar sintaxis de todos los playbooks:
ansible-playbook --syntax-check -i inventory/hosts.ini create_user.yml
ansible-playbook --syntax-check -i inventory/hosts.ini install_package.yml
ansible-playbook --syntax-check -i inventory/hosts.ini reboot.yml
```

> 💡 **Nota de seguridad**: Las contraseñas se pasan mediante un archivo YAML temporal en `/tmp/` (modo 0600) y se eliminan automáticamente después de la ejecución. Nunca aparecen en `ps aux`.

---

## 📊 Logs y debugging

### Ver logs en tiempo real

```bash
# En otra terminal, mientras el servidor corre:
tail -f backend/admin_panel.log
```

### Ejemplo de salida de log durante instalación de paquete

```
[2026-03-17 17:22:26] INFO  POST /packages/ → pkg='links'
[2026-03-17 17:22:26] INFO  ▶ Iniciando playbook: install_package.yml
[2026-03-17 17:22:27] INFO  [INSTALL_PACKAGE] TASK [Gathering Facts]
[2026-03-17 17:22:30] INFO  [INSTALL_PACKAGE] ok: [localhost]
[2026-03-17 17:22:30] INFO  [INSTALL_PACKAGE] TASK [install_packages : Instalar paquete links]
[2026-03-17 17:23:14] INFO  [INSTALL_PACKAGE] changed: [localhost]
[2026-03-17 17:23:14] INFO  ✔ Playbook install_package.yml completado exitosamente (rc=0)
```

### Via API

```bash
curl http://localhost:8000/logs/?lines=50
```

---

## 🔧 Solución de problemas comunes

### Error: Permission denied en `.vite/deps`

```bash
sudo chown -R $(whoami):$(whoami) frontend/node_modules/.vite
```

### Error: No se puede abrir la base de datos SQLite

```bash
sudo chown -R devops:devops backend/data/
chmod 755 backend/data/
```

### Error: Ansible no encuentra el inventario

```bash
# Verificar que exista:
cat backend/ansible/inventory/hosts.ini
# Debe contener:
# [local]
# localhost ansible_connection=local
```

### El servidor necesita sudo para instalar paquetes

```bash
# Verificar sudoers:
sudo -l | grep NOPASSWD
# Si no aparece, configurar según la sección "Configuración de sudoers"
```

---

## 📦 Dependencias del sistema

```bash
# Instalar todo de una vez:
sudo apt update && sudo apt install -y \
  python3 \
  python3-pip \
  python3-venv \
  nodejs \
  npm \
  ansible
```

---

## 🤝 Contribución

1. Clonar el repositorio
2. Crear una rama: `git checkout -b feature/mi-feature`
3. Hacer cambios y commitear: `git commit -m "feat: descripción"`
4. Abrir un Pull Request

---

*Admin Control Panel v2 — Backend powered by Ansible Playbooks*
