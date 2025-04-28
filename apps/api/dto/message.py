from pydantic import BaseModel

import datetime as dt

from apps.api.dao.sender import SenderRole


class MessageIn(BaseModel):
    sender: SenderRole
    recipient: SenderRole          # 👈 新增
    body: str

class MessageOut(BaseModel):
    sender: SenderRole
    recipient: SenderRole
    body: str
    ts: dt.datetime
    class Config: from_attributes = True