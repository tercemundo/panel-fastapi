from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    password_hash = Column(String)
    sudo_file = Column(String)  # path como /etc/sudoers.d/pepe
    created_at = Column(DateTime, default=datetime.utcnow)

class Package(Base):
    __tablename__ = "packages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    installed = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
