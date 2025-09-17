"""
SQLAlchemy setup: engine, session, Base, and helpers.
Uses DATABASE_URL; supports SQLite with proper connect args.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
    pass


def get_database_url() -> str | None:
    return os.getenv("DATABASE_URL")


def create_sqlalchemy_engine():
    database_url = get_database_url()
    if not database_url:
        return None
    connect_args = {}
    if database_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(database_url, connect_args=connect_args, future=True)


engine = create_sqlalchemy_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True) if engine else None


def get_db_session():
    if not SessionLocal:
        raise RuntimeError("DATABASE_URL not configured; persistence disabled")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


