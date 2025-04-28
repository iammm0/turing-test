import uuid
import datetime as dt

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from apps.api.dao.base import Base


class Guess(Base):
    __tablename__ = "guesses"
    game_id:         Mapped[uuid.UUID] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), primary_key=True)
    interrogator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    suspect_ai:      Mapped[bool]
    guessed_at:      Mapped[dt.datetime] = mapped_column(server_default=func.now())