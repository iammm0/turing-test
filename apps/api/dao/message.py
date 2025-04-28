import uuid
import datetime as dt

from sqlalchemy import ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.core.database import Base
from apps.api.dao.sender import SenderRole


class Message(Base):
    __tablename__ = "messages"
    id:      Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    game_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"))
    sender:  Mapped[SenderRole] = mapped_column(Enum(SenderRole))
    body:    Mapped[str]
    ts:      Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    recipient: Mapped[SenderRole] = mapped_column(
        Enum(SenderRole, name="sender_role"), default=SenderRole.I, nullable=False
    )

    game = relationship("Game", backref="messages")