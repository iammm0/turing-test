import uuid
from typing import Optional
import datetime as dt

from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column

from apps.api.dao.base import Base


class User(Base):
    __tablename__ = "users"
    id:           Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email:        Mapped[Optional[str]] = mapped_column(String, unique=True)
    display_name: Mapped[Optional[str]]
    password_hash:Mapped[Optional[str]]
    elo:          Mapped[int]          = mapped_column(default=1000)
    created_at:   Mapped[dt.datetime]  = mapped_column(server_default=func.now())