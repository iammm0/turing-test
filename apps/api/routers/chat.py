import asyncio
import datetime as dt
import json
import uuid
from typing import List, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.core.redis import rdb, publish_chat
from apps.api.dao.game import Game
from apps.api.dao.message import Message
from apps.api.dao.sender import SenderRole
from apps.api.service.deepseek_service import DeepSeekClient

router = APIRouter(prefix="/ws", tags=["chat"])
llm = DeepSeekClient()

# ────────────────────────────────────────────────────────
@router.websocket(
    "/rooms/{game_id}/{role}",
    name="房间内实时聊天；按 sender_recipient 分双通道",
)
async def chat_socket(
    ws: WebSocket,
    game_id: uuid.UUID,
    role: SenderRole,                                 # I / A / H
    db: AsyncSession = Depends(get_db),
):
    await ws.accept()

    # ------- 校验游戏存在 -------
    game: Game | None = await db.get(Game, game_id)
    if not game:
        await ws.close(code=4404)
        return

    # ------- 确定订阅通道 -------
    if role == SenderRole.I:
        channels = [f"room:{game_id}:A_I", f"room:{game_id}:H_I"]
    elif role == SenderRole.A:
        channels = [f"room:{game_id}:I_A"]
    else:
        channels = [f"room:{game_id}:I_H"]

    pubsub = rdb.pubsub()
    await pubsub.subscribe(*channels)

    async def relay():
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                await ws.send_text(msg["data"])

    relay_task = asyncio.create_task(relay())

    try:
        while True:
            text_raw = await ws.receive_text()
            msg_in: Dict = json.loads(text_raw)
            # 必须包含 sender / recipient / body
            if {"sender", "recipient", "body"} - msg_in.keys():
                await ws.send_text(json.dumps({"error": "invalid payload"}))
                continue

            # 权限校验：当前连接只能发送自己身份
            if msg_in["sender"] != role.value:
                await ws.send_text(json.dumps({"error": "sender mismatch"}))
                continue

            # 时间戳
            now_dt = dt.datetime.now(dt.UTC)
            msg_in["ts"] = now_dt.isoformat()

            # ---------- 广播 ----------
            await publish_chat(game_id, msg_in)

            # ---------- 持久化 ----------
            db.add(
                Message(
                    game_id=game_id,
                    sender=SenderRole(msg_in["sender"]),
                    recipient=SenderRole(msg_in["recipient"]),
                    body=msg_in["body"],
                    ts=now_dt,
                )
            )
            await db.commit()

            # ---------- AI 生成 ----------
            if msg_in["sender"] == "I" and msg_in["recipient"] == "A":
                # ① 构建 I↔A 历史
                stmt = (
                    select(Message)
                    .where(
                        Message.game_id == game_id,
                        Message.sender.in_([SenderRole.I, SenderRole.A]),
                        Message.recipient.in_([SenderRole.I, SenderRole.A]),
                    )
                    .order_by(Message.ts)
                )
                rows = (await db.execute(stmt)).scalars().all()

                history: List[Dict[str, str]] = [
                    {"role": "system", "content": "你是18岁可爱女孩云遥..."}
                ]
                for m in rows:
                    role_tag = "user" if m.sender == SenderRole.I else "assistant"
                    history.append({"role": role_tag, "content": m.body})
                history.append({"role": "user", "content": msg_in["body"]})

                # ② 调 LLM
                ai_reply = await llm.complete(history)

                # ③ 广播 & 写库
                ai_dt = dt.datetime.now(dt.UTC)
                ai_msg = {
                    "sender": "A",
                    "recipient": "I",
                    "body": ai_reply,
                    "ts": ai_dt.isoformat(),
                }
                await publish_chat(game_id, ai_msg)
                db.add(
                    Message(
                        game_id=game_id,
                        sender=SenderRole.A,
                        recipient=SenderRole.I,
                        body=ai_reply,
                        ts=ai_dt,
                    )
                )
                await db.commit()

    except WebSocketDisconnect:
        relay_task.cancel()
        await pubsub.close()
