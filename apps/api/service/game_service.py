import datetime as dt
import uuid

from sqlalchemy import update, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.db import models
from apps.api.models.schemas import GameCreate
from apps.api.service.user_service import UserService


def _calc_elo(old_elo: int, opp_elo: int, win: bool, k: int = 32) -> int:
    """最经典的 Elo 更新：E = 1/(1+10^((opp-self)/400))"""
    expected = 1 / (1 + 10 ** ((opp_elo - old_elo) / 400))
    score = 1 if win else 0
    return round(old_elo + k * (score - expected))

class GameService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_game(self, interrogator_id: uuid.UUID, payload: GameCreate) -> models.Game:
        """创建游戏并验证玩家身份"""
        user_svc = UserService(self.db)

        # 确保玩家已登录且存在
        await user_svc.get_or_create(interrogator_id)  # 创建或获取审讯者
        if payload.witness_human_id:
            await user_svc.get_or_create(payload.witness_human_id)  # 创建或获取证人

        game = models.Game(
            interrogator_id=interrogator_id,
            witness_ai=payload.witness_ai,
            witness_human_id=payload.witness_human_id,
            side=models.Side.AI if payload.witness_ai else models.Side.HUMAN,
            status=models.GameStatus.WAITING
        )
        self.db.add(game)
        await self.db.commit()
        await self.db.refresh(game)
        return game

    async def start_game(self, game_id: uuid.UUID):
        """启动游戏"""
        await self.db.execute(
            update(models.Game)
            .where(models.Game.id == game_id)
            .values(status=models.GameStatus.CHAT, started_at=models.func.now())
        )
        await self.db.commit()

    async def finish_and_judge(self, game_id: uuid.UUID, suspect_ai: bool, user: models.User) -> models.Game | None:
        """结束游戏并判定 AI"""
        async with self.db.begin():  # 事务处理
            stmt = (
                select(models.Game)
                .where(models.Game.id == game_id)
                .with_for_update()
            )
            game = (await self.db.scalars(stmt)).one_or_none()
            if game is None:
                return None
            if game.status not in (models.GameStatus.CHAT, models.GameStatus.WAITING):
                return game  # 已判定，直接返回

            # 记录猜测
            guess = models.Guess(
                game_id=game.id,
                interrogator_id=game.interrogator_id,
                suspect_ai=suspect_ai,
            )
            self.db.add(guess)

            # 判定成功与否
            correct = suspect_ai == (game.side == models.Side.AI)
            game.success = correct
            game.status = models.GameStatus.ENDED
            game.ended_at = dt.datetime.now()

            # Elo 更新
            interrogator = game.interrogator  # relationship 已 lazy-load
            # 如果是人类证人，使用证人的 Elo，若是 AI 则使用默认值 1000
            witness_elo = 1000
            if not game.witness_ai and game.witness_human:
                witness_elo = game.witness_human.elo

            # 更新审讯者 Elo（只更新审讯者）
            interrogator.elo = _calc_elo(interrogator.elo, witness_elo, correct)

            # 如果是人类证人，也更新证人 Elo
            if not game.witness_ai and game.witness_human:
                game.witness_human.elo = _calc_elo(witness_elo, interrogator.elo, not correct)

        await self.db.refresh(game)
        return game
