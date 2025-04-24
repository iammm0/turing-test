import uuid

from fastapi import APIRouter, Depends, HTTPException

from apps.api.core.database import get_db
from apps.api.models.schemas import GameOut, GuessIn
from apps.api.service.game_service import GameService

router = APIRouter(prefix="/rooms", tags=["guess"])

@router.post("/{game_id}/guess", response_model=GameOut, summary="审讯者提交“谁是 AI”判定并结束游戏")
async def submit_guess(game_id: uuid.UUID, body: GuessIn,
                       db=Depends(get_db)):
    service = GameService(db)
    game = await service.finish_and_judge(game_id, body.suspect_ai)
    if not game:
        raise HTTPException(404, "game not found")
    return game
