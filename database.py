import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use DATABASE_URL env var (set on Render with PostgreSQL)
# Falls back to local SQLite for development
_raw = os.environ.get("DATABASE_URL", "").strip()
_valid_prefixes = ("sqlite:", "postgresql:", "postgres:")

if not _raw or not any(_raw.startswith(p) for p in _valid_prefixes):
    DATABASE_URL = "sqlite:///./banco.db"
else:
    DATABASE_URL = _raw

# Render sets postgres:// but SQLAlchemy requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs check_same_thread=False; PostgreSQL doesn't
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from models import Base

    Base.metadata.create_all(bind=engine)
