import asyncio
import base64
import json
import random
import uuid
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from apps.api.core.config import settings
from apps.api.core.redis import rdb
from apps.api.dao.game import Game, GameStatus, MatchStatus
from apps.api.service.game_service import GameService

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
        await websocket.send_json({"action": "error", "detail": "缺少 token 参数"})
        return await websocket.close()

    try:
        # 只解析 payload 部分（第二段），不验证签名
        payload_part = token.split(".")[1]
        # 补足 Base64 padding
        padded = payload_part + '=' * (-len(payload_part) % 4)
        decoded = base64.urlsafe_b64decode(padded)
        payload = json.loads(decoded)
        user_id = uuid.UUID(payload["sub"])
    except Exception as e:
        await websocket.send_json({"action": "error", "detail": f"Token 解码失败: {str(e)}"})
        return await websocket.close()

    # 3️⃣ 如果用户正在游戏中，拒绝排队并断开
    if user_id in ACTIVE_USERS:
        await websocket.send_json({
            "action": "error",
            "detail": "您已有正在进行的对局，不能再次排队"
        })
        return await websocket.close()

    # 4️⃣ 注册玩家
    uid_str = str(user_id)
    PLAYERS[uid_str] = websocket

    try:
         # 主循环：接收客户端指令
        while True:
            try:
                data = await websocket.receive_json()
            except (WebSocketDisconnect, RuntimeError):
                # 客户端断开或者主动 close，都走这里，退出循环
                break

            action = data.get("action")

            if action == "join":
                # 玩家请求加入匹配队列
                # 再次检查是否已在游戏
                if uid_str in ACTIVE_USERS:
                    await websocket.send_json({
                        "action": "error",
                        "detail": "您已有正在进行的对局，不能再次排队"
                    })
                    return await websocket.close()

                # 加入队列
                if websocket not in QUEUE:
                    QUEUE.append(websocket)

            elif action == "leave":
                # 玩家请求退出匹配队列
                if websocket in QUEUE:
                    QUEUE.remove(websocket)

            elif action in ("accept", "decline"):
                match_id = data.get("match_id")
                info = PENDING.get(match_id)
                if not info:
                    continue

                # 拒绝：取消定时、通知对方重排、关闭自己
                if action == "decline":
                    info["timer"].cancel()
                    for other in info["others"]:
                        if other!=uid_str and other in PLAYERS:
                            await PLAYERS[other].send_json({"action": "requeue"})
                            QUEUE.append(PLAYERS[other])
                        return await websocket.close()

                # 接受
                info["accepted"].add(uid_str)
                if info["accepted"] == set(info["users"]):
                    # 标记匹配已确认
                    info["match_status"] = MatchStatus.CONFIRMED
                    # 双方都同意，取消定时，创建对局
                    info["timer"].cancel()
                    await _finalize_match(match_id, info)
                    # finalize 会 close，break 掉这个循环
                    break


    finally:
        # 无论何种情况（断开、error、完成匹配），都要清理自己在 QUEUE / PLAYERS 中的痕迹
        if websocket in QUEUE:
            QUEUE.remove(websocket)

        PLAYERS.pop(uid_str, None)


async def matchmaker_loop():
    """后台任务：每秒检查队列，2人以上则配对并发 invite"""
    while True:
        await asyncio.sleep(1)
        if len(QUEUE) < 2:
            continue

        # 1) 从队列取出两个 WS
        ws1 = QUEUE.pop(0)
        ws2 = QUEUE.pop(0)

        # 2) 反查各自的 user_id（字符串）
        uid1 = next((u for u, w in PLAYERS.items() if w is ws1), None)
        uid2 = next((u for u, w in PLAYERS.items() if w is ws2), None)

        # 如果任一端已经掉线／被移除，就把活着的那端放回队列，然后跳过
        if not uid1 or not uid2:
            # ws1 还活着，就补回队列
            if uid1 and ws1 not in QUEUE:
                QUEUE.insert(0, ws1)
            # ws2 还活着，就补回队列
            if uid2 and ws2 not in QUEUE:
                QUEUE.insert(0, ws2)
            continue

        # 随机分配角色
        if random.random() < 0.5:
            roles = {uid1: "I", uid2: "W"}
        else:
            roles = {uid2: "I", uid1: "W"}

        match_id = str(uuid.uuid4())
        timer = asyncio.get_event_loop().call_later(
            CONFIRM_WINDOW, lambda: asyncio.create_task(_on_timeout(match_id))
        )
        PENDING[match_id] = {
            "users": [uid1, uid2],
            "roles": roles,
            "accepted": set(),
            "match_status": MatchStatus.WAITING,  # ← 新增
            "timer": timer,
        }

        # 发邀请
        for uid in (uid1, uid2):
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


async def _finalize_match(match_id: str, info: dict):
    """
    双方 accept 后：
      1) 创建 Game 并标记 ACTIVE_USERS
      2) 通知客户端 matched，并 close WS
      3) 清理 PENDING
    """
    # 标记正在游戏
    for uid in info["users"]:
        ACTIVE_USERS.add(uid)

    # 2) 准备参数
    roles = info["roles"]
    inviter_id_str = next(u for u, r in roles.items() if r == "I")
    human_id_str = next(u for u, r in roles.items() if r == "W")
    ai_id_str = None  # 如果你有专门的 AI 用户，可以从 settings 拿

    # 转 UUID
    inviter_id = uuid.UUID(inviter_id_str)
    human_id = uuid.UUID(human_id_str)
    ai_witness_id = uuid.UUID(ai_id_str) if ai_id_str else None

    # 创建 Game
    async with AsyncSessionLocal() as db:
        gs = GameService(db)
        game = await gs.create_and_start_game(
            interrogator_id=inviter_id,
            human_witness_id=human_id,
            ai_witness_id=ai_witness_id,
        )

    # 派发一个 5 分钟后结束聊天的后台任务
    asyncio.create_task(_schedule_chat_end(str(game.id)))

    # 通知并断开
    for uid in info["users"]:
        ws = PLAYERS.get(uid)
        if not ws:
            continue

        # ① 提示
        await ws.send_json({
            "action": "game_starting",
            "game_id": str(game.id),
            "detail": "匹配成功，正在进入对局…"
        })
        await asyncio.sleep(1)

        # ② 真正进入
        await ws.send_json({
            "action": "matched",
            "game_id": str(game.id)
        })

        await ws.close()
        PLAYERS.pop(uid, None)

    # 清理掉 pending 条目
    PENDING.pop(match_id, None)


async def _schedule_chat_end(game_id: str):
    # 等 5 分钟
    await asyncio.sleep(5 * 60 * 12)

    # 1) 更新数据库状态
    async with AsyncSessionLocal() as db:
        game = await db.get(Game, uuid.UUID(game_id))
        if not game:
            return
        game.status = GameStatus.JUDGING  # 标记“聊天已结束，等待猜测”
        await db.commit()

    # 2) 向所有三方推送“聊天结束”
    #    约定好的频道名，比如：
    channels = [
        f"room:{game_id}:A_I",
        f"room:{game_id}:I_A",
        f"room:{game_id}:H_I",
        f"room:{game_id}:I_H",
    ]
    msg = json.dumps({"action": "chat_ended", "detail": "聊天已结束，请审讯者做出最终猜测"})
    for ch in channels:
        await rdb.publish(ch, msg)
