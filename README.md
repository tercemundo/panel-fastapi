# 🖥️ Admin Control Panel

Panel de administración de sistemas Linux con interfaz web moderna. Permite gestionar usuarios sudo, instalar paquetes APT, y monitorear recursos del sistema en tiempo real desde un navegador.

---

## ✨ Funcionalidades

| Función | Descripción |
|---|---|
| 👤 **Gestión de Usuarios** | Crea usuarios del sistema con acceso sudo y entrada en `/etc/sudoers.d/` |
| 📦 **Gestor de Paquetes** | Instala paquetes del sistema via `apt` con output en tiempo real |
| 💾 **Monitoreo de Disco** | Muestra espacio usado / total en la partición raíz |
| 🧠 **Monitoreo de RAM** | Muestra el porcentaje de uso de memoria en tiempo real |
| 🔁 **Reinicio de Servidor** | Botón para reiniciar el sistema desde la UI |

---

## 🗂️ Estructura del Proyecto

```
admin-panel/
├── backend/                    # API FastAPI (Python)
│   ├── main.py                 # Endpoints REST: /users/, /packages/, /system/, /reboot/
│   ├── database.py             # Configuración SQLAlchemy + SQLite
│   ├── models.py               # Modelos ORM (User, Package)
│   ├── schemas.py              # Esquemas Pydantic para validación
│   ├── crud.py                 # Lógica de base de datos
│   ├── test_main.py            # Tests con pytest + httpx (97% cobertura)
│   ├── requirements.txt        # Dependencias Python
│   └── data/
│       └── admin.db            # Base de datos SQLite (se crea automáticamente)
│
├── frontend/                   # App React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── App.jsx             # Componente principal con UI tipo Accordion
│   │   └── index.css           # Estilos globales Tailwind
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── docker-compose.yml          # Solo para el frontend (backend corre nativo)
├── start_backend.sh            # Script para arrancar el backend como root
└── README.md
```

---

## 🚀 Cómo correr el proyecto

### Prerrequisitos

- Python 3.11+
- Node.js 20+
- Sistema Linux con `apt` (Debian/Ubuntu)

### 1. Instalar dependencias del Backend

```bash
cd admin-panel/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Arrancar el Backend (como root)

El backend necesita permisos de root para crear usuarios del sistema e instalar paquetes. Desde el directorio raíz del proyecto:

```bash
sudo /home/devops/fastapi/admin-panel/backend/venv/bin/uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --app-dir /home/devops/fastapi/admin-panel/backend
```

> ⚠️ **Importante:** reemplaza `/home/devops` con tu propio home si es diferente.

La API quedará disponible en: `http://localhost:8000`  
Documentación interactiva (Swagger): `http://localhost:8000/docs`

### 3. Arrancar el Frontend

En una terminal separada:

```bash
cd admin-panel/frontend
npm install
npm run dev
```

El panel quedará disponible en: **`http://localhost:5173`**

---

## 🔌 API Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/system/` | Retorna uso de disco y RAM |
| `POST` | `/users/` | Crea un usuario del sistema con sudo |
| `POST` | `/packages/` | Instala un paquete via APT |
| `POST` | `/reboot/` | Reinicia el servidor |

### Ejemplo: Crear usuario

```bash
curl -X POST http://localhost:8000/users/ \
  -H "Content-Type: application/json" \
  -d '{"name": "juan", "password": "MiPass123!", "repeat_password": "MiPass123!"}'
```

Resultado: Se crea el usuario `juan` en el sistema y se escribe `/etc/sudoers.d/juan` con:
```
juan ALL=(ALL) NOPASSWD: ALL
```

### Ejemplo: Instalar paquete

```bash
curl -X POST http://localhost:8000/packages/ \
  -H "Content-Type: application/json" \
  -d '{"name": "htop"}'
```

---

## 🧪 Correr Tests del Backend

```bash
cd admin-panel/backend
source venv/bin/activate
pytest test_main.py -v --cov=. --cov-report=term-missing
```

---

## 🛠️ Stack Tecnológico

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) — Framework REST en Python
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM para SQLite
- [Passlib + bcrypt](https://passlib.readthedocs.io/) — Hash seguro de contraseñas
- [psutil](https://github.com/giampaolo/psutil) — Monitoreo de recursos del sistema
- [pytest + httpx](https://pytest.org/) — Testing con 97% de cobertura

**Frontend:**
- [React 18](https://react.dev/) — UI con componentes funcionales y hooks
- [Vite](https://vitejs.dev/) — Build tool ultra-rápido con HMR
- [Tailwind CSS](https://tailwindcss.com/) — Estilado utilitario
- [Lucide React](https://lucide.dev/) — Librería de iconos
- [Axios](https://axios-http.com/) — Cliente HTTP

---

## 📤 Subir a GitHub

### 1. Inicializar el repositorio Git

Desde el directorio raíz del proyecto:

```bash
cd /home/devops/fastapi/admin-panel
git init
```

### 2. Crear `.gitignore`

```bash
cat > .gitignore << 'EOF'
# Python
backend/venv/
backend/__pycache__/
backend/.pytest_cache/
backend/.coverage
backend/data/admin.db

# Node
frontend/node_modules/
frontend/dist/

# Misc
*.log
.DS_Store
EOF
```

### 3. Hacer el primer commit

```bash
git add .
git commit -m "feat: admin panel inicial con FastAPI + React"
```

### 4. Crear el repositorio en GitHub

1. Andá a [github.com/new](https://github.com/new)
2. Ponele un nombre, por ejemplo `admin-panel`
3. Dejá el repo **vacío** (sin README, sin .gitignore)
4. Copiá la URL del repo (ejemplo: `https://github.com/tu-usuario/admin-panel.git`)

### 5. Subir el código

```bash
git remote add origin https://github.com/TU-USUARIO/admin-panel.git
git branch -M main
git push -u origin main
```

Listo — tu código estará publicado en GitHub. Para actualizaciones futuras:

```bash
git add .
git commit -m "descripción del cambio"
git push
```
