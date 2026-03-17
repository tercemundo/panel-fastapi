import psutil
from sqlalchemy.orm import Session
from models import User, Package
import schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_user(db: Session, user: schemas.UserCreate):
    if user.password != user.repeat_password:
        raise ValueError("Passwords don't match")
    hashed = pwd_context.hash(user.password)
    sudo_path = f"/etc/sudoers.d/{user.name}"
    db_user = User(name=user.name, password_hash=hashed, sudo_file=sudo_path)
    db.add(db_user)
    db.commit()
    return db_user

def install_package(db: Session, pkg: schemas.PackageCreate):
    db_pkg = Package(name=pkg.name, installed="apt install -y " + pkg.name)
    db.add(db_pkg)
    db.commit()
    return db_pkg

def get_system_info():
    disk = psutil.disk_usage('/')
    mem = psutil.virtual_memory()
    return {
        "disk": f"{disk.used / (1024**3):.1f}GB / {disk.total / (1024**3):.1f}GB",
        "memory": f"{mem.percent:.1f}% used"
    }
