import uuid, datetime as dt

from sqlalchemy import update, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.db import models
from apps.api.models.schemas import GameCreate

def _calc_elo(old_elo: int, opp_elo: int, win: bool, k: int = 32) -> int:
    """最经典的 Elo 更新：E = 1/(1+10^((opp-self)/400))"""
    expected = 1 / (1 + 10 ** ((opp_elo - old_elo) / 400))
    score    = 1 if win else 0
    return round(old_elo + k * (score - expected))

class GameService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_game(self, interrogator_id: uuid.UUID, payload: GameCreate) -> models.Game:
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

    async def start_game(self, game_id: str):
        await self.db.execute(
            update(models.Game)
            .where(models.Game.id == game_id)
            .values(status=models.GameStatus.CHAT, started_at=models.func.now())
        )
        await self.db.commit()

    async def finish_and_judge(
            self,
            game_id: uuid.UUID,
            suspect_ai: bool,
    ) -> models.Game | None:
        """
        1. 根据 game.side 判断真实 AI 身份
        2. 写 guesses、更新 games.success/status/ended_at
        3. 简单 Elo 结算
        """
        async with self.db.begin():  # 事务
            stmt = (
                select(models.Game)
                .where(models.Game.id == game_id)
                .with_for_update()
            )
            game = (await self.db.scalars(stmt)).one_or_none()
            if game is None:
                return None
            if game.status not in (
                    models.GameStatus.CHAT,
                    models.GameStatus.WAITING,
            ):
                return game  # 已判定

            # ---------- 1. 写 Guess ----------
            guess = models.Guess(
                game_id=game.id,
                interrogator_id=game.interrogator_id,
                suspect_ai=suspect_ai,
            )
            self.db.add(guess)

            # ---------- 2. 判定成功与否 ----------
            # 真实 AI 是否在 A 方取自 game.side == Side.AI
            correct = suspect_ai == (game.side == models.Side.AI)
            game.success = correct
            game.status = models.GameStatus.ENDED
            game.ended_at = dt.datetime.now()

            # ---------- 3. Elo 更新 ----------
            interrogator = game.interrogator  # relationship 已 lazy-load
            # witness Elo：AI 用默认 1000；Human witness 用他本人的 Elo
            witness_elo = 1000
            if not game.witness_ai and game.witness_human:
                witness_elo = game.witness_human.elo

            # I vs Witness 结算，只更新 interrogator Elo
            interrogator.elo = _calc_elo(
                interrogator.elo, witness_elo, correct
            )

            # 可选：同时给 witness（若是人）调 Elo
            if not game.witness_ai and game.witness_human:
                game.witness_human.elo = _calc_elo(
                    witness_elo, interrogator.elo, not correct
                )

        await self.db.refresh(game)
        return game