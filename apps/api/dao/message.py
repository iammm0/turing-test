# apps/api/dao/message.py
import uuid
import datetime as dt

from sqlalchemy import ForeignKey, Enum, DateTime, String, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.dao.base import Base
from apps.api.dao.sender import SenderRole


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    game_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("games.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender:    Mapped[SenderRole] = mapped_column(
        Enum(SenderRole, name="sender_role_enum"),
        nullable=False,
    )
    recipient: Mapped[SenderRole] = mapped_column(
        Enum(SenderRole, name="recipient_role_enum"),
        nullable=False,
    )
    body:      Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )
    ts:        Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    game = relationship("Game", back_populates="messages")

    __table_args__ = (
        Index("idx_messages_ts", "ts"),
    )
