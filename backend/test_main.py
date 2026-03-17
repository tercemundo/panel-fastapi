from fastapi.testclient import TestClient
from main import app, get_db
from database import Base, engine
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session
from schemas import UserCreate, PackageCreate

# Configuración inicial: limpiar DB
Base.metadata.create_all(bind=engine)

client = TestClient(app)

@patch("subprocess.run")
def test_add_user_success(mock_run):
    mock_run.return_value = MagicMock()
    user_data = {"name": "testuser_success", "password": "password", "repeat_password": "password"}
    response = client.post("/users/", json=user_data)
    assert response.status_code == 200
    assert response.json() == {"name": "testuser_success", "message": "User created successfully"}
    assert mock_run.call_count == 3

def test_add_user_passwords_mismatch():
    user_data = {"name": "testuser2", "password": "password", "repeat_password": "different"}
    response = client.post("/users/", json=user_data)
    assert response.status_code == 400
    assert "Passwords don't match" in response.json()["detail"]

@patch("subprocess.run")
def test_add_package_success(mock_run):
    # Simulamos STDOUT al crear el error / éxito
    mock_run_instance = MagicMock()
    mock_run_instance.stdout = "Package installed correctly."
    mock_run.return_value = mock_run_instance

    pkg_data = {"name": "mockedpkg"}
    response = client.post("/packages/", json=pkg_data)
    assert response.status_code == 200
    assert response.json()["name"] == "mockedpkg"
    assert response.json()["installed"] == "apt install -y mockedpkg"

@patch("subprocess.run")
def test_add_package_fail(mock_run):
    import subprocess
    mock_run.side_effect = subprocess.CalledProcessError(
        returncode=100, 
        cmd=["apt", "install", "-y", "badpkg"], 
        output="Reading package lists...", 
        stderr="E: Unable to locate package badpkg"
    )

    pkg_data = {"name": "badpkg"}
    response = client.post("/packages/", json=pkg_data)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "Unable to locate package badpkg" in detail

@patch("crud.psutil")
def test_system_info(mock_psutil):
    disk_mock = MagicMock()
    disk_mock.used = 10 * (1024**3)
    disk_mock.total = 100 * (1024**3)
    mock_psutil.disk_usage.return_value = disk_mock
    
    mem_mock = MagicMock()
    mem_mock.percent = 45.5
    mock_psutil.virtual_memory.return_value = mem_mock

    response = client.get("/system/")
    assert response.status_code == 200
    data = response.json()
    assert data["disk"] == "10.0GB / 100.0GB"
    assert data["memory"] == "45.5% used"

@patch("main.subprocess.Popen")
def test_reboot(mock_popen):
    mock_popen.return_value = MagicMock()
    response = client.post("/reboot/")
    assert response.status_code == 200
    assert response.json()["status"] == "rebooting"
