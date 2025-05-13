import asyncio
import datetime as dt
import json
import random
import uuid
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.logger import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.core.redis import rdb, publish_chat
from apps.api.dao.game import Game, GameStatus
from apps.api.dao.guess import Guess  # ← 用于存储审讯者的猜测
from apps.api.dao.message import Message
from apps.api.dao.sender import SenderRole
from apps.api.service.llm_service import Grok3Client
from apps.api.service.prompt_builders.prompt_builder import make_prompt_builder
from apps.api.utils.auth import decode_token
from apps.api.utils.process_reply import post_process_reply

# 握手 & 校验：await ws.accept() + 验证 Game 存在。
# 双通道：I 订阅 A→I、H→I；A 订阅 I→A；H 订阅 I→H。
# 消息分发：
# 收到 action="message"
# 校验字段 & 角色
# 发布到 Redis → 其他客户端中继
# 写入 messages 表
# 若 I→A，则构造上下文调用 LLM，生成 AI 回答并走同样流程
# 猜测流程：
# action="guess" 且仅 I 可调用
# 提交 suspect_ai_id / suspect_human_id / interrogator_id
# 对比 Game 中存的真实证人
# 写入 guesses 表 + 返回 {action:"guess_result",is_correct}
# 断线处理：停止中继任务并取消 Redis 订阅。

router = APIRouter(prefix="/ws", tags=["chat"])

# 创建 PromptBuilder
prompt_builder = make_prompt_builder()

# ⚙️ 在模块级别创建 DeepSeekClient 实例，内置各类 PromptBuilder
# _llm = DeepSeekClient(
#     prompt_builder=prompt_builder,
# )

_llm = Grok3Client(
    prompt_builder,
    api_key="sk-ykFU3QyxG9LpZdLRe4acHdKvQFVBWmUQbeqDBolLq14CdhK0"
)

# —— 全局变量：标记已启动的 AI 后台任务 —— 🆕
AI_STARTED: set[str] = set()

@router.websocket(
    "/rooms/{game_id}/{role}",
    name="房间内实时聊天；按 sender_recipient 分双通道"
)
async def chat_socket(
    ws: WebSocket,
    game_id: uuid.UUID,
    role: SenderRole,              # I / A / H
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket 端点说明：
    - 路径参数：
        game_id: 对局 UUID
        role:    连接角色：I(Interrogator)/A(AI)/H(Human witness)
    - 功能：
      1. 验证对局是否存在，否则 4404 关闭。
      2. 按角色订阅对应的 Redis 频道，实时转发消息。
      3. 接收两类客户端消息：
         a. 聊天消息 (action="message")
            - 发布到 Redis
            - 存入 messages 表
            - 如果是 I→A，还要调用 LLM 生成 AI 回复
         b. 猜测 (action="guess") —— 仅限审讯者
            - 验证 payload
            - 判断猜测是否正确
            - 存入 guesses 表
            - 返回猜测结果
    4. 处理客户端断连，清理后台任务与订阅。
    """
    # ── 1. 握手并接受 WebSocket 连接 ──
    await ws.accept()
    prev_len = 0  # 前一条消息长度，初始为 0

    token = ws.query_params.get("token")
    if not token:
        await ws.send_json({
            "error": "token missing"
        })
        return await ws.close(code=4401)

    try:
        payload = decode_token(token)
        user_id = uuid.UUID(payload["sub"])
    except Exception as e:
        await ws.send_json({"error": "invalid token", "detail": str(e)})
        return await ws.close(code=4402)

    # ── 2. 校验对局存在 ──
    game = await db.get(Game, game_id)
    if not game:
        # 对局不存在 -> 关闭连接并返回
        await ws.close(code=4404)
        return

    logger.info(f"User {user_id} as {role} connected to game {game_id}")

    # ── 3. 按角色订阅对应 Redis 频道 ──
    # 审讯者 I 要接收来自 AI(A) 和 人类(H) 的消息
    if role == SenderRole.I:
        # ✅ 启动 AI 聊天任务（非阻塞） + 去重防重复 🆕
        if str(game_id) not in AI_STARTED:
            AI_STARTED.add(str(game_id))  # 🆕 标记当前任务已启动
            asyncio.create_task(start_ai_for_game(game_id, db))

        channels = [f"room:{game_id}:A_I", f"room:{game_id}:H_I"]

    # AI 只接收 I 发送的消息
    elif role == SenderRole.A:
        channels = [f"room:{game_id}:I_A"]
    # 人类证人 只接收 I 发送的消息
    else:
        channels = [f"room:{game_id}:I_H"]

    pubsub = rdb.pubsub()
    await pubsub.subscribe(*channels)

    # 后台任务：持续监听 Redis，将收到的消息转给前端
    async def relay():
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                # msg["data"] 是字符串，直接发给 ws
                await ws.send_text(msg["data"])

    relay_task = asyncio.create_task(relay())

    try:
        # 主循环：处理前端发来的消息
        while True:
            raw = await ws.receive_text()
            try:
                packet: Dict = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_json({"error": "invalid JSON"})
                continue

            action = packet.get("action")

            # ── 聊天消息逻辑 ──
            if action == "message":
                required = {"sender", "recipient", "body"}
                missing = required - packet.keys()
                # 校验必需字段
                if missing:
                    await ws.send_json({"error": f"missing fields: {missing}"})
                    continue

                # 确保发送者角色和 WebSocket 绑定角色一致
                if packet["sender"] != role.value:
                    await ws.send_json({"error": "sender mismatch"})
                    continue

                # 时间戳
                now = dt.datetime.now(dt.UTC)
                packet["ts"] = now.isoformat()

                # a) 发布到 Redis，让其他通道订阅者收到
                await publish_chat(game_id, packet)

                clean_body = post_process_reply(packet["body"])
                # b) 持久化到数据库
                db.add(Message(
                    game_id=game_id,
                    sender=SenderRole(packet["sender"]),
                    recipient=SenderRole(packet["recipient"]),
                    body=clean_body,
                    ts=now,
                ))
                await db.commit()

            # ── 猜测逻辑 ──
            elif action == "guess":
                # 仅审讯者可猜
                if role != SenderRole.I:
                    await ws.send_text(json.dumps({"error": "只有审讯者可以猜解"}))
                    continue

                # 猜测 payload 校验
                if {"suspect_ai_id", "suspect_human_id", "interrogator_id"} - packet.keys():
                    await ws.send_text(json.dumps({"error": "invalid guess payload"}))
                    continue

                # 解析 UUID
                try:
                    ai_id = uuid.UUID(packet["suspect_ai_id"])
                    hu_id = uuid.UUID(packet["suspect_human_id"])
                    iq_id = uuid.UUID(packet["interrogator_id"])
                except (ValueError, TypeError):
                    # 只捕获格式或类型错误
                    await ws.send_text(json.dumps({"error": "invalid UUID in guess"}))
                    continue

                # 判断正确性：比对数据库中真实存储
                correct = (ai_id == game.witness_ai_id and hu_id == game.witness_human_id)

                # 存入 guesses 表
                db.add(Guess(
                    game_id=game_id,
                    interrogator_id=iq_id,
                    guessed_ai_id=ai_id,
                    guessed_human_id=hu_id,
                    is_correct=correct,
                ))
                game.status = GameStatus.ENDED
                await db.commit()

                # 返回猜测结果
                await ws.send_json({
                    "action": "guess_result",
                    "is_correct": correct
                })

            # ── 无效 action ──
            else:
                await ws.send_text(json.dumps({"error": "unknown action"}))


    except WebSocketDisconnect:
        logger.info(f"User {user_id} as {role} disconnected from game {game_id}")
    finally:
        try:
            relay_task.cancel()
            await asyncio.wait_for(relay_task, timeout=1)
        except:
            pass
        await pubsub.close()


async def start_ai_for_game(game_id: uuid.UUID, db: AsyncSession):
    """
    AI 后台监听 I→A，生成并发送 AI 回复（无需 WebSocket）
    """
    channel = f"room:{game_id}:I_A"
    pubsub = rdb.pubsub()
    await pubsub.subscribe(channel)

    async for msg in pubsub.listen():
        if msg["type"] != "message":
            continue

        try:
            data = json.loads(msg["data"])
            if data.get("action") != "message":
                continue

            human_input = data.get("body")
            now = dt.datetime.now(dt.UTC)

            # 拉取上下文
            stmt = (
                select(Message)
                .where(
                    Message.game_id == game_id,
                    Message.sender.in_([SenderRole.I, SenderRole.A]),
                    Message.recipient.in_([SenderRole.I, SenderRole.A])
                )
                .order_by(Message.ts)
            )
            history = (await db.execute(stmt)).scalars().all()

            ai_reply = await _llm.chat_reply(history, human_input)
            ai_clean = post_process_reply(ai_reply)

            delay = (
                1.0
                + random.normalvariate(0.3, 0.03) * len(ai_reply)
                + random.gammavariate(2.5, 0.25)
            )

            await asyncio.sleep(delay)

            # 构造消息
            reply_packet = {
                "action": "message",
                "sender": SenderRole.A.value,
                "recipient": SenderRole.I.value,
                "body": ai_clean,
                "ts": dt.datetime.now(dt.UTC).isoformat()
            }

            await publish_chat(game_id, reply_packet)

            db.add(Message(
                game_id=game_id,
                sender=SenderRole.A,
                recipient=SenderRole.I,
                body=ai_reply,
                ts=now
            ))
            await db.commit()

        except Exception as e:
            logger.error(f"❌ AI 处理失败: {e}")
            break

