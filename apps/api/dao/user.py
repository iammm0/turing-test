# apps/api/dao/user.py
import uuid
import datetime as dt
from typing import Optional, List

from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.dao.base import Base
from apps.api.dao.game import Game
from apps.api.dao.guess import Guess


class User(Base):
    __tablename__ = "users"

    id:            Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email:         Mapped[Optional[str]] = mapped_column(
        String, unique=True, nullable=True
    )
    display_name:  Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    elo:           Mapped[int]          = mapped_column(Integer, default=1000, nullable=False)
    created_at:    Mapped[dt.datetime]  = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # —— 关系 ——  
    guesses: Mapped[List[Guess]] = relationship(
        "Guess",
        back_populates="interrogator",
        foreign_keys=[Guess.interrogator_id],
        cascade="all, delete-orphan",
    )

    games_as_interrogator: Mapped[List[Game]] = relationship(
        "Game",
        back_populates="interrogator",
        foreign_keys="[Game.interrogator_id]",
        cascade="all, delete-orphan",
    )
    games_as_witness: Mapped[List[Game]] = relationship(
        "Game",
        back_populates="witness_human",
        foreign_keys="[Game.witness_human_id]",
        cascade="all, delete-orphan",
    )
