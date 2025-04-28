import uuid

from pydantic import BaseModel

from apps.api.dao.game import GameStatus, Side


class GameCreate(BaseModel):
    witness_ai: bool = True   # 若为 False 需带 witness_human_id
    witness_human_id: uuid.UUID | None = None

class GameOut(BaseModel):
    id: uuid.UUID
    status: GameStatus
    side: Side
    success: bool | None

    class Config: from_attributes = True