from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import subprocess
import os
import tempfile
import yaml
import logging
import threading
from datetime import datetime
from database import SessionLocal, engine, Base
from crud import create_user, install_package, get_system_info
from schemas import UserCreate, PackageCreate, SystemInfo

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ──────────────────────────────────────────────
# Logging setup → escribe en admin_panel.log
# ──────────────────────────────────────────────
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "admin_panel.log")

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),        # también imprime en consola (uvicorn)
    ]
)
logger = logging.getLogger("admin-panel")


# ──────────────────────────────────────────────
# Ansible helpers
# ──────────────────────────────────────────────
ANSIBLE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ansible")
INVENTORY   = os.path.join(ANSIBLE_DIR, "inventory", "hosts.ini")


def _stream_process(proc: subprocess.Popen, tag: str, output_lines: list):
    """Lee stdout y stderr del proceso línea a línea, logueando cada una."""
    def _read(stream, level):
        for raw in iter(stream.readline, ""):
            line = raw.rstrip()
            if not line:
                continue
            output_lines.append(line)
            if level == "OUT":
                logger.info("[%s] %s", tag, line)
            else:
                logger.warning("[%s][stderr] %s", tag, line)

    t_out = threading.Thread(target=_read, args=(proc.stdout, "OUT"), daemon=True)
    t_err = threading.Thread(target=_read, args=(proc.stderr, "ERR"), daemon=True)
    t_out.start()
    t_err.start()
    t_out.join()
    t_err.join()


def run_playbook(playbook: str, extra_vars: dict = None, vars_file_data: dict = None) -> str:
    """
    Ejecuta un ansible-playbook contra localhost, streameando la salida
    línea a línea al log de archivo y a la consola.

    - extra_vars:      vars no sensibles → --extra-vars
    - vars_file_data:  vars sensibles (password, etc.) → archivo temporal /tmp/
    Retorna el output completo como string o lanza RuntimeError.
    """
    playbook_path = os.path.join(ANSIBLE_DIR, playbook)
    tag = playbook.replace(".yml", "").upper()

    cmd = [
        "ansible-playbook",
        "-v",                   # verbose: muestra cada task
        "-i", INVENTORY,
        playbook_path,
    ]

    tmp_vars_path = None

    try:
        ev = dict(extra_vars or {})

        if vars_file_data:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".yml", delete=False,
                dir="/tmp", prefix="ansible_vars_"
            ) as f:
                yaml.dump(vars_file_data, f, default_flow_style=False, allow_unicode=True)
                tmp_vars_path = f.name
            os.chmod(tmp_vars_path, 0o600)
            ev["vars_file"] = tmp_vars_path

        if ev:
            cmd += ["--extra-vars", " ".join(f"{k}={v}" for k, v in ev.items())]

        logger.info("▶ Iniciando playbook: %s | extra_vars_keys=%s",
                    playbook, list(ev.keys()))

        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=ANSIBLE_DIR,
        )

        output_lines: list[str] = []
        _stream_process(proc, tag, output_lines)
        proc.wait()

        if proc.returncode != 0:
            logger.error("✗ Playbook %s finalizó con error (rc=%d)", playbook, proc.returncode)
            raise RuntimeError("\n".join(output_lines[-30:]))   # últimas 30 líneas del error

        logger.info("✔ Playbook %s completado exitosamente (rc=0)", playbook)
        return "\n".join(output_lines)

    finally:
        if tmp_vars_path and os.path.exists(tmp_vars_path):
            os.unlink(tmp_vars_path)


# ──────────────────────────────────────────────
# DB helper
# ──────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.post("/users/", response_model=dict)
def add_user(user: UserCreate, db: Session = Depends(get_db)):
    """Crea un usuario del sistema vía Ansible (role: manage_users)."""
    logger.info("POST /users/ → username='%s'", user.name)
    try:
        if user.password != user.repeat_password:
            raise ValueError("Las contraseñas no coinciden")

        db_user = create_user(db, user)

        stdout = run_playbook(
            "create_user.yml",
            vars_file_data={"username": user.name, "password": user.password},
        )

        return {
            "name": db_user.name,
            "message": "Usuario creado exitosamente via Ansible",
            "ansible_output": stdout[-3000:],
        }
    except ValueError as e:
        logger.warning("POST /users/ → ValueError: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error("POST /users/ → Ansible error: %s", str(e)[:300])
        raise HTTPException(status_code=500, detail=f"Ansible error: {str(e)}")
    except Exception as e:
        logger.error("POST /users/ → Exception: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/packages/")
def add_package(pkg: PackageCreate, db: Session = Depends(get_db)):
    """Instala un paquete APT vía Ansible (role: install_packages)."""
    logger.info("POST /packages/ → pkg='%s'", pkg.name)
    try:
        stdout = run_playbook(
            "install_package.yml",
            extra_vars={"pkg_name": pkg.name},
        )

        db_pkg = install_package(db, pkg)

        return {
            "name": db_pkg.name,
            "installed": db_pkg.installed,
            "log": stdout[-3000:],
        }
    except RuntimeError as e:
        logger.error("POST /packages/ → Ansible error: %s", str(e)[:300])
        raise HTTPException(
            status_code=500,
            detail=f"Ansible error al instalar {pkg.name}: {str(e)}"
        )
    except Exception as e:
        logger.error("POST /packages/ → Exception: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/system/")
def system_info():
    return get_system_info()


@app.get("/logs/")
def get_logs(lines: int = 100):
    """Retorna las últimas N líneas del log de actividad (default: 100)."""
    try:
        if not os.path.exists(LOG_FILE):
            return {"lines": [], "file": LOG_FILE}
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
        return {
            "file": LOG_FILE,
            "total_lines": len(all_lines),
            "lines": [l.rstrip() for l in all_lines[-lines:]],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reboot/")
def reboot():
    """Reinicia el sistema vía Ansible (role: reboot_system)."""
    logger.info("POST /reboot/ → solicitando reinicio del sistema")
    try:
        run_playbook("reboot.yml")
        return {"status": "rebooting"}
    except RuntimeError as e:
        return {"status": "rebooting", "note": str(e)}
