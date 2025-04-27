import random
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.core.redis import push_queue, QUEUE_MATCH, pop_two, PENDING_MATCH, rdb
from apps.api.db.models import User, Game, Side, GameStatus
from apps.api.service.user_service import UserService
from apps.api.utils.auth import get_current_user

router = APIRouter(prefix="/match", tags=["matchmaker"])

@router.post("/queue")
async def enqueue(
    user: User = Depends(get_current_user),  # 通过 token 校验获取当前用户
):
    # 直接往单一队列里 push
    await push_queue(user.id)
    return {"message": "已成功加入匹配队列"}

@router.post("/poll", summary="轮询匹配结果，若两端就位则返回新建房间 ID")
async def poll(db: AsyncSession = Depends(get_db)):
    # 从队列里取出两位玩家
    u1, u2 = await pop_two()
    if not u1 or not u2:
        return {"matched": False}

        # 随机分配谁做审讯者
    if random.choice([True, False]):
        interrogator_id, witness_id = u1, u2
    else:
        interrogator_id, witness_id = u2, u1

        # 创建游戏房间
    game = await create_game(interrogator_id, witness_id, db)
    return {"matched": True, "game_id": str(game.id)}

@router.post("/accept", summary="玩家接受匹配确认")
async def accept_match(
    match_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    key = PENDING_MATCH + match_id
    # 1. 确认这是一个有效的待确认匹配
    if not await rdb.exists(key):
        raise HTTPException(404, detail="匹配已过期或不存在")

    uid = str(user.id)
    # 2. 标记当前用户接受
    await rdb.hset(key, f"accepted:{uid}", "1")

    # 3. 取出 hash 中所有字段
    data = await rdb.hgetall(key)
    # 确保我们有两个人的 accepted 和 role 信息
    # accepted:<user_id> = '0' 或 '1'
    accepted_vals = [int(v) for k, v in data.items() if k.startswith("accepted:")]

    # 4. 判断是否已经全部接受
    if all(val == 1 for val in accepted_vals):
        # 提取角色映射
        roles = {k.split("role:")[1]: v for k, v in data.items() if k.startswith("role:")}
        # 找到审讯者和证人 ID
        interrogator_id = uuid.UUID(next(uid for uid, r in roles.items() if r == "I"))
        witness_id      = uuid.UUID(next(uid for uid, r in roles.items() if r == "W"))

        # 确保用户在 DB 中存在
        svc = UserService(db)
        await svc.get_or_create(interrogator_id)
        await svc.get_or_create(witness_id)

        # 5. 创建游戏
        game = Game(
            interrogator_id=interrogator_id,
            witness_human_id=witness_id,
            witness_ai=False,
            side=Side.HUMAN,
            status=GameStatus.ACTIVE
        )
        db.add(game)
        await db.commit()
        await db.refresh(game)

        # 6. 删除临时 Redis key
        await rdb.delete(key)

        return {"game_id": str(game.id)}

    # 如果还有人未接受，则返回等待状态
    return {"waiting": True}

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
