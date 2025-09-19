from datetime import datetime, date, time

from sqlalchemy import String, DateTime, Boolean, Date, Time
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class TodoORM(Base):
    __tablename__ = "todos"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="medium")
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=True)
    reminder_time: Mapped[time] = mapped_column(Time, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


