from fastapi import FastAPI, Depends, WebSocket, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import subprocess
import os
import asyncio
from database import SessionLocal, engine, Base
from crud import create_user, install_package, get_system_info
from schemas import UserCreate, PackageCreate, SystemInfo

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/users/", response_model=dict)
def add_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Validar contraseñas y guardar en DB
        db_user = create_user(db, user)
        # Crear usuario sistema
        subprocess.run(["useradd", "-m", "-s", "/bin/bash", user.name], check=True)
        subprocess.run(f"echo '{user.name}:{user.password}' | chpasswd", shell=True, check=True)
        subprocess.run(["usermod", "-aG", "sudo", user.name], check=True)
        with open(f"/etc/sudoers.d/{user.name}", "w") as f:
            f.write(f"{user.name} ALL=(ALL) NOPASSWD:ALL\n")
        os.chmod(f"/etc/sudoers.d/{user.name}", 0o440)
        return {"name": db_user.name, "message": "User created successfully"}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(400, str(e))

@app.post("/packages/")
def add_package(pkg: PackageCreate, db: Session = Depends(get_db)):
    try:
        # Usar capture_output para capturar los errores reales de apt
        env = os.environ.copy()
        env["DEBIAN_FRONTEND"] = "noninteractive"
        result = subprocess.run(
            ["apt", "install", "-y", pkg.name], 
            check=True, 
            capture_output=True, 
            text=True,
            env=env
        )
        db_pkg = install_package(db, pkg)
        return {"name": db_pkg.name, "installed": db_pkg.installed, "log": result.stdout}
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Fallo al instalar {pkg.name}.\nSalida: {e.stdout}\nError: {e.stderr}"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/system/")
def system_info():
    return get_system_info()

@app.post("/reboot/")
def reboot():
    subprocess.Popen(["reboot"])  # Non-blocking
    return {"status": "rebooting"}


