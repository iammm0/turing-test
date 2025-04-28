import uuid

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: uuid.UUID
    display_name: str | None
    elo: int
    class Config: from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr | None = None
    display_name: str | None = None
    password: str | None = None  # 可选匿名