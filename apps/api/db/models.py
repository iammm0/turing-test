import enum

class SenderRole(str, enum.Enum):
    I = "I"
    A = "A"
    H = "H"

import enum, uuid, datetime as dt
from typing import Optional
from sqlalchemy import Enum, String, Boolean, ForeignKey, func, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs

class Base(AsyncAttrs, DeclarativeBase):
    pass

# ---------- ENUM ----------
class Sender(str, enum.Enum):
    I = "I"   # Interrogator
    A = "A"   # AI
    H = "H"   # Human witness

class Side(str, enum.Enum):
    HUMAN = "HUMAN"
    AI    = "AI"

class GameStatus(str, enum.Enum):
    WAITING = "WAITING"
    CHAT    = "CHAT"
    JUDGED  = "JUDGED"
    ENDED   = "ENDED"

# ---------- USER ----------
class User(Base):
    __tablename__ = "users"
    id:           Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email:        Mapped[Optional[str]] = mapped_column(String, unique=True)
    display_name: Mapped[Optional[str]]
    password_hash:Mapped[Optional[str]]
    elo:          Mapped[int]          = mapped_column(default=1000)
    created_at:   Mapped[dt.datetime]  = mapped_column(server_default=func.now())

# ---------- GAME ----------
class Game(Base):
    __tablename__ = "games"
    id:              Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    interrogator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    witness_human_id:Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"))
    witness_ai:      Mapped[bool]       = mapped_column(Boolean, default=False)
    side:            Mapped[Side]       = mapped_column(Enum(Side), default=Side.AI)
    status:          Mapped[GameStatus] = mapped_column(Enum(GameStatus), default=GameStatus.WAITING)
    started_at:      Mapped[Optional[dt.datetime]]
    ended_at:        Mapped[Optional[dt.datetime]]
    success:         Mapped[Optional[bool]]

    interrogator = relationship("User", foreign_keys=[interrogator_id])
    witness_human = relationship("User", foreign_keys=[witness_human_id])

# ---------- MESSAGE ----------
class Message(Base):
    __tablename__ = "messages"
    id:      Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    game_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"))
    sender:  Mapped[Sender] = mapped_column(Enum(Sender))
    body:    Mapped[str]
    ts:      Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    recipient: Mapped[Sender] = mapped_column(
        Enum(Sender, name="sender_role"), default=Sender.I, nullable=False
    )

    game = relationship("Game", backref="messages")

# ---------- GUESS ----------
class Guess(Base):
    __tablename__ = "guesses"
    game_id:         Mapped[uuid.UUID] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), primary_key=True)
    interrogator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    suspect_ai:      Mapped[bool]
    guessed_at:      Mapped[dt.datetime] = mapped_column(server_default=func.now())
