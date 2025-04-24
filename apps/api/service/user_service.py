import uuid
from typing import cast

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.db import models


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create(
            self, user_id: uuid.UUID, elo: int = 1000
    ) -> models.User:
        user = await self.db.get(models.User, user_id)
        if user:
            return cast(models.User, user)      # 👈 告诉类型检查器它是实例
        user = models.User(id=user_id, elo=elo)
        self.db.add(user)
        await self.db.flush()      # 不 commit，留给上层事务
        return user