import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.core.redis import push_queue, pop_match, QUEUE_INTERROGATOR, QUEUE_WITNESS
from apps.api.models.schemas import GameCreate
from apps.api.service.game_service import GameService
from apps.api.service.user_service import UserService

router = APIRouter(prefix="/match", tags=["matchmaker"])

@router.post("/queue", summary="把当前用户按角色加入实时匹配队列")
async def enqueue(
        role: str,
        user_id: uuid.UUID,
        elo: int = 1000,
        db: AsyncSession = Depends(get_db),
):
    # ① 先确保用户存在
    user_svc = UserService(db)
    await user_svc.get_or_create(user_id, elo)

    # ② 再进入 Redis 等候池
    queue = QUEUE_INTERROGATOR if role == "I" else QUEUE_WITNESS
    await push_queue(queue, user_id, elo)

    return {"queued": True}

@router.post("/poll", summary="轮询匹配结果，若两端就位则返回新建房间 ID")
async def poll(
        db: AsyncSession = Depends(get_db)
):
    iid, wid = await pop_match()
    if not iid or not wid:
        return {"matched": False}

    user_svc = UserService(db)
    await user_svc.get_or_create(uuid.UUID(iid))
    await user_svc.get_or_create(uuid.UUID(wid))

    game_svc = GameService(db)
    game = await game_svc.create_game(
        interrogator_id=uuid.UUID(iid),
        payload=GameCreate(witness_ai=False, witness_human_id=uuid.UUID(wid))
    )

    return {"matched": True, "game_id": str(game.id)}
