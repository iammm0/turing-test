# apps/api/dao/game.py
import enum
import uuid
import datetime as dt

from sqlalchemy import ForeignKey, Boolean, Enum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.dao.base import Base


# ────────────── “匹配阶段” ──────────────
class MatchStatus(str, enum.Enum):
    WAITING   = "WAITING"    # 玩家已进入匹配队列，等待配对或对方确认
    CONFIRMED = "CONFIRMED"  # 双方都按了“accept”，即将进入对局

# ────────────── “游戏阶段” ──────────────
class GameStatus(str, enum.Enum):
    CHATTING = "CHATTING"  # 聊天阶段（5 分钟倒计时中）
    JUDGING  = "JUDGING"   # 聊天结束，等待审讯者提交猜测
    ENDED    = "ENDED"     # 对局结束（猜测已出，已打分／记录）


class Side(str, enum.Enum):
    HUMAN = "HUMAN"
    AI    = "AI"


class Game(Base):
    __tablename__ = "games"

    # —— 主键 UUID ——
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # —— 外键列 ——
    interrogator_id:  Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    witness_human_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    witness_ai_id:    Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # —— 状态字段 ——
    status:    Mapped[GameStatus] = mapped_column(
        Enum(GameStatus, name="gamestatus_enum"),
        default=GameStatus.CHATTING,
        nullable=False,
    )
    started_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    ended_at:   Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    # True=猜对, False=猜错, None=未猜
    success:   Mapped[bool]      = mapped_column(
        Boolean,
        nullable=True,
    )

    # —— 关系 ——
    interrogator  = relationship(
        "User",
        foreign_keys=[interrogator_id],
        back_populates="games_as_interrogator",
    )
    witness_human = relationship(
        "User",
        foreign_keys=[witness_human_id],
        back_populates="games_as_witness",
    )
    witness_ai    = relationship(
        "User",
        foreign_keys=[witness_ai_id],
    )

    messages = relationship(
        "Message",
        back_populates="game",
        cascade="all, delete-orphan",
    )
    guesses  = relationship(
        "Guess",
        back_populates="game",
        cascade="all, delete-orphan",
    )
