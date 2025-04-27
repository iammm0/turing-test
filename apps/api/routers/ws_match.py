import asyncio
import random
import uuid
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from apps.api.core.config import settings
from apps.api.db.models import Game, Side, GameStatus
from apps.api.service.user_service import UserService
from apps.api.utils.auth import decode_token

router = APIRouter()

# —— 数据库连接配置 ——
engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
)

# 异步 Session 工厂
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,  # 不自动过期，符合大多数场景
)

# —— 全局匹配状态 ——
QUEUE: List[WebSocket] = []               # 排队队列（FIFO）
PLAYERS: Dict[str, WebSocket] = {}         # user_id -> WebSocket
PENDING: Dict[str, dict] = {}              # match_id -> {users, roles, accepted, timer}
ACTIVE_USERS: set[str] = set()              # 正在游戏中的用户 ID 集合
CONFIRM_WINDOW = 60                        # 确认超时时长（秒）


@router.websocket("/ws/match")
async def ws_match(websocket: WebSocket):
    """
    WebSocket 端点：处理排队(join)、退出(leave)、接受(accept)、拒绝(decline)
    客户端连接时需附带 ?token=<access_token>
    """
    # 1️⃣ 握手并接收连接
    await websocket.accept()

    # 2️⃣ 从 query 参数读取并验证 token
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    try:
        payload = decode_token(token)
        user_id = uuid.UUID(payload["sub"])
    except HTTPException:
        await websocket.close(code=1008)
        return

    uid_str = str(user_id)
    PLAYERS[uid_str] = websocket

    # 3️⃣ 如果用户正在游戏中，拒绝排队并断开
    if uid_str in ACTIVE_USERS:
        await websocket.send_json({
            "action": "error",
            "detail": "您已有正在进行的对局，不能再次排队"
        })
        await websocket.close()
        PLAYERS.pop(uid_str, None)
        return

    try:
        # 4️⃣ 主循环：接收客户端指令
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "join":
                # 玩家请求加入匹配队列
                # 再次检查是否已在游戏
                if uid_str in ACTIVE_USERS:
                    await websocket.send_json({
                        "action": "error",
                        "detail": "您已有正在进行的对局，不能再次排队"
                    })
                    await websocket.close()
                    PLAYERS.pop(uid_str, None)
                    return

                if websocket not in QUEUE:
                    QUEUE.append(websocket)

            elif action == "leave":
                # 玩家请求退出匹配队列
                if websocket in QUEUE:
                    QUEUE.remove(websocket)

            elif action == "accept":
                # 玩家接受匹配邀请
                match_id = data.get("match_id")
                info = PENDING.get(match_id)
                if not info:
                    continue
                info["accepted"].add(uid_str)
                # 如果所有玩家都接受，则创建游戏
                if info["accepted"] == set(info["users"]):
                    info["timer"].cancel()
                    await _create_game(info)

            elif action == "decline":
                # 玩家拒绝匹配
                match_id = data.get("match_id")
                info = PENDING.pop(match_id, None)
                if info:
                    # 取消超时定时
                    info["timer"].cancel()
                await websocket.send_json({"action": "declined"})
                await websocket.close()
                PLAYERS.pop(uid_str, None)
                return

    except WebSocketDisconnect:
        # 客户端断开连接，清理状态
        if websocket in QUEUE:
            QUEUE.remove(websocket)
        PLAYERS.pop(uid_str, None)


async def matchmaker_loop():
    """
    后台任务：每秒检查一次队列，若 >=2 人则配对并发送邀请
    """
    while True:
        await asyncio.sleep(1)
        if len(QUEUE) < 2:
            continue

        # 从队列取出两个玩家
        ws1 = QUEUE.pop(0)
        ws2 = QUEUE.pop(0)
        uid1 = next(u for u, w in PLAYERS.items() if w is ws1)
        uid2 = next(u for u, w in PLAYERS.items() if w is ws2)

        # 随机分配角色：I = 审讯者，W = 证人
        if random.random() < 0.5:
            roles = {uid1: "I", uid2: "W"}
        else:
            roles = {uid2: "I", uid1: "W"}

        match_id = str(uuid.uuid4())
        # 设置超时回调
        timer = asyncio.get_event_loop().call_later(
            CONFIRM_WINDOW,
            lambda: asyncio.create_task(_on_timeout(match_id))
        )
        PENDING[match_id] = {
            "users": [uid1, uid2],
            "roles": roles,
            "accepted": set(),
            "timer": timer,
        }

        # 向两位玩家发送匹配成功邀请
        for uid in PENDING[match_id]["users"]:
            ws = PLAYERS.get(uid)
            if ws:
                await ws.send_json({
                    "action": "match_found",
                    "match_id": match_id,
                    "role": roles[uid],
                    "window": CONFIRM_WINDOW,
                })


async def _on_timeout(match_id: str):
    """
    超时处理：如果玩家在时限内未确认，则通知重排
    """
    info = PENDING.pop(match_id, None)
    for uid in info["users"]:
        ws = PLAYERS.get(uid)
        if ws:
            await ws.send_json({
                "action": "timeout",
                "detail": "匹配超时，已断开连接"
            })
            await ws.close()
            PLAYERS.pop(uid, None)


async def _create_game(info: dict):
    """
    双方都 accept 后：创建 Game，标记 ACTIVE_USERS，推送 matched 并断开
    """
    # 1) 将用户标记为“正在游戏中”
    for uid in info["users"]:
        ACTIVE_USERS.add(uid)

    # 2) 在数据库中创建 Game
    async with AsyncSessionLocal() as db:
        svc = UserService(db)
        # 审讯者与证人 UUID
        i_uid = uuid.UUID(next(u for u, r in info["roles"].items() if r == "I"))
        w_uid = uuid.UUID(next(u for u, r in info["roles"].items() if r == "W"))
        await svc.get_or_create(i_uid)
        await svc.get_or_create(w_uid)

        game = Game(
            interrogator_id=i_uid,
            witness_human_id=w_uid,
            witness_ai=False,
            side=Side.HUMAN,
            status=GameStatus.ACTIVE,
        )
        db.add(game)
        await db.commit()
        await db.refresh(game)

    # 3) 通知双方进入，并断开各自连接
    for uid in info["users"]:
        ws = PLAYERS.get(uid)
        if ws:
            await ws.send_json({
                "action": "matched",
                "game_id": str(game.id)
            })
            await ws.close()            # 匹配成功后断开连接
            PLAYERS.pop(uid, None)

    # 4) 清理 PENDING
    PENDING.pop(info, None)
