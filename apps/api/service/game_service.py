import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from apps.api.dao.game import Game, Side, GameStatus
from apps.api.service.user_service import UserService

class GameService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_svc = UserService(db)

    async def create_and_start_game(self, roles: dict[str, str]) -> Game:
        """
        roles: { user_id_str: "I"|"W", ... }
        随机分配的结果已经在外面传好。
        1) 确保两个用户存在
        2) 持久化 Game(status=ACTIVE)
        3) 返回 ORM 对象
        """
        # 找到审讯者／证人字符串 ID，并转 uuid.UUID
        interrogator_id = uuid.UUID(next(u for u,r in roles.items() if r == "I"))
        witness_id       = uuid.UUID(next(u for u,r in roles.items() if r == "W"))

        # 1) 确保 User 存在
        await self.user_svc.get_or_create(interrogator_id)
        await self.user_svc.get_or_create(witness_id)

        # 2) 创建 Game 并写库
        game = Game(
            interrogator_id=interrogator_id,
            witness_human_id=witness_id,
            witness_ai=False,
            side=Side.HUMAN,
            status=GameStatus.ACTIVE
        )
        self.db.add(game)
        await self.db.commit()
        await self.db.refresh(game)
        return game
