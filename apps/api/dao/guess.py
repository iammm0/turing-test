# apps/api/dao/guess.py
import uuid
import datetime as dt

from sqlalchemy import ForeignKey, Boolean, DateTime, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.dao.base import Base


class Guess(Base):
    __tablename__ = "guesses"

    # —— 复合主键 ——  
    game_id:         Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("games.id", ondelete="CASCADE"),
        primary_key=True,
    )
    interrogator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # —— 审讯者的猜测 ——  
    guessed_ai_id:    Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
    )
    guessed_human_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
    )

    is_correct: Mapped[bool]      = mapped_column(
        Boolean,
        nullable=False,
    )
    guessed_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # —— 关系 ——  
    game         = relationship("Game", back_populates="guesses")
    interrogator = relationship("User", foreign_keys=[interrogator_id], back_populates="guesses")
    guessed_ai   = relationship("User", foreign_keys=[guessed_ai_id])
    guessed_human= relationship("User", foreign_keys=[guessed_human_id])

    __table_args__ = (
        Index("idx_guesses_guessed_at", "guessed_at"),
    )
