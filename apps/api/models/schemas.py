from pydantic import BaseModel, EmailStr
import uuid, datetime as dt

from apps.api.db.models import GameStatus, Side, Sender


# -------- User --------
class UserOut(BaseModel):
    id: uuid.UUID
    display_name: str | None
    elo: int
    class Config: from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr | None = None
    display_name: str | None = None
    password: str | None = None  # 可选匿名

# -------- Game --------
class GameCreate(BaseModel):
    witness_ai: bool = True   # 若为 False 需带 witness_human_id
    witness_human_id: uuid.UUID | None = None

class GameOut(BaseModel):
    id: uuid.UUID
    status: GameStatus
    side: Side
    success: bool | None

    class Config: from_attributes = True

# -------- Message --------
class MessageIn(BaseModel):
    sender: Sender
    recipient: Sender          # 👈 新增
    body: str

class MessageOut(BaseModel):
    sender: Sender
    recipient: Sender
    body: str
    ts: dt.datetime
    class Config: from_attributes = True

# -------- Guess --------
class GuessIn(BaseModel):
    suspect_ai: bool
