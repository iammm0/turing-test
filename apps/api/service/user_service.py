import uuid
from typing import Optional, Sequence, Type

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from apps.api.dao import models
from apps.api.dao.game import Game
from apps.api.dao.message import Message
from apps.api.dao.user import User


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create(self, user_id: uuid.UUID, elo: int = 1000) -> Type[User] | User:
        """获取用户或创建新用户"""
        user = await self.db.get(User, user_id)
        if user:
            return user
        # 如果用户不存在，创建新用户
        user = User(id=user_id, elo=elo)
        self.db.add(user)
        await self.db.flush()  # 不 commit，留给上层事务
        return user

    async def get_user(self, user_id: uuid.UUID) -> Optional[User]:
        """获取单个用户"""
        user = await self.db.get(User, user_id)
        return user

    async def get_users(self, limit: int = 100, offset: int = 0) -> Sequence[User]:
        """获取用户列表（支持分页）"""
        stmt = select(User).limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update_user(self, user_id: uuid.UUID, display_name: Optional[str] = None,
                          elo: Optional[int] = None) -> User:
        """更新用户信息"""
        stmt = select(User).where(User.id == user_id)
        user = await self.db.execute(stmt)
        user = user.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        if display_name is not None:
            user.display_name = display_name
        if elo is not None:
            user.elo = elo

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user(self, user_id: uuid.UUID) -> bool:
        """删除用户"""
        stmt = select(User).where(User.id == user_id)
        user = await self.db.execute(stmt)
        user = user.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        await self.db.delete(user)
        await self.db.commit()
        return True

    async def get_user_game_history(self, user_id: uuid.UUID) -> Sequence[Game]:
        """获取用户的游戏历史记录"""
        stmt = (
            select(Game)
            .join(User, User.id == Game.interrogator_id)
            .filter(User.id == user_id)
            .options(joinedload(Game.interrogator))
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_user_messages(self, user_id: uuid.UUID) -> Sequence[Message]:
        """获取用户的消息记录"""
        stmt = select(Message).filter(Message.sender == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()
