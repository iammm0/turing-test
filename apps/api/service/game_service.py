import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from apps.api.dao.game import Game, GameStatus
from apps.api.service.user_service import UserService

class GameService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_svc = UserService(db)

    async def create_and_start_game(
            self,
            interrogator_id: uuid.UUID,
            human_witness_id: uuid.UUID,
            ai_witness_id: uuid.UUID | None = None
    ) -> Game:

        await self.user_svc.get_or_create(interrogator_id)
        await self.user_svc.get_or_create(human_witness_id)

        if ai_witness_id:
            await self.user_svc.get_or_create(ai_witness_id)

        # 2) 创建 Game 并写库
        game = Game(
            interrogator_id=interrogator_id,
            witness_human_id=human_witness_id,
            witness_ai_id=ai_witness_id,
            status=GameStatus.ACTIVE,
        )

        self.db.add(game)
        await self.db.commit()
        await self.db.refresh(game)
        return game
