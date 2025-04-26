import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.core.redis import push_queue, pop_match, QUEUE_INTERROGATOR, QUEUE_WITNESS
from apps.api.db.models import User, Game, Side, GameStatus
from apps.api.service.user_service import UserService
from apps.api.utils.auth import get_current_user

router = APIRouter(prefix="/match", tags=["matchmaker"])

@router.post("/queue")
async def enqueue(
    role: str,
    elo: int,
    user: User = Depends(get_current_user),  # 通过 token 校验获取当前用户
):
    user_id = user.id
    if role == "I":
        queue = "queue:interrogator"
    elif role == "W":
        queue = "queue:witness"
    else:
        raise HTTPException(400, detail="无效的角色")

    # 加入队列
    await push_queue(queue, user_id, elo)
    return {"message": "已成功加入匹配队列"}

@router.post("/poll", summary="轮询匹配结果，若两端就位则返回新建房间 ID")
async def poll(db: AsyncSession = Depends(get_db)):
    i, w = await pop_match()  # 从 Redis 队列中取出两个玩家
    if not i or not w:
        return {"matched": False}

    # 玩家匹配成功，创建游戏
    game = await create_game(i, w, db)
    return {"matched": True, "game_id": str(game.id)}

async def create_game(i: uuid.UUID, w: uuid.UUID, db: AsyncSession):
    # 确保两位玩家已经存在
    user_svc = UserService(db)
    await user_svc.get_or_create(i)  # 确保审讯者存在
    await user_svc.get_or_create(w)  # 确保证人存在

    # 创建房间逻辑：确保至少有一名证人
    game = Game(
        interrogator_id=i,        # 审讯者
        witness_human_id=w if w else None,  # 确保有证人，若无则为 None
        witness_ai=False if w else True,  # 如果有证人则为人类证人，否则为 AI 证人
        side=Side.HUMAN if w else Side.AI, # 如果有证人，则为人类；否则为 AI
        status=GameStatus.WAITING  # 游戏状态为等待
    )
    db.add(game)
    await db.commit()
    await db.refresh(game)  # 确保 game 对象最新
    return game
