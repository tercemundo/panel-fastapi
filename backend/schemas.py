from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    name: str
    password: str
    repeat_password: str

class UserResponse(BaseModel):
    name: str
    sudo_file: str

class PackageCreate(BaseModel):
    name: str

class SystemInfo(BaseModel):
    disk: str
    memory: str
