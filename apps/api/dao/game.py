import enum
import uuid
from typing import Optional
import datetime as dt

from sqlalchemy import ForeignKey, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.dao.base import Base

class GameStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    WAITING = "WAITING"
    CHAT    = "CHAT"
    JUDGED  = "JUDGED"
    ENDED   = "ENDED"

class Side(str, enum.Enum):
    HUMAN = "HUMAN"
    AI    = "AI"

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


