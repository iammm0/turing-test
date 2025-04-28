import datetime as dt
import json
import os
import uuid

import redis.asyncio as redis  # 👈 统一用 redis.asyncio

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:16379/0")
rdb: redis.Redis = redis.from_url(REDIS_URL, decode_responses=True)  # decode_responses=True 省去手动 .decode()

# 👉 改为单一队列
QUEUE_MATCH = "queue:matchmaking"
PENDING_MATCH = "pending:match:"  # append match_id

async def push_queue(user_id: uuid.UUID):
    """
        将 user_id 加入指定的有序集合，score 基于时间戳 + elo/100 以兼顾先后与水平
        """
    member = f"user:{user_id}"
    await rdb.lpush(QUEUE_MATCH, member)


async def pop_two():
    """
        从队列尾部取出两名玩家，实现 FIFO 匹配
        返回两个 UUID，若不足两人返回 (None, None)
    """
    # 从尾部弹出（最早入队）
    raw1 = await rdb.rpop(QUEUE_MATCH)
    raw2 = await rdb.rpop(QUEUE_MATCH)
    if not raw1 or not raw2:
        # 如果任意一端取不到，放回已取出的
        if raw1:
            await rdb.rpush(QUEUE_MATCH, raw1)
        return None, None
    u1 = uuid.UUID(raw1.split(':')[1])
    u2 = uuid.UUID(raw2.split(':')[1])
    # 防止自己匹配自己
    if u1 == u2:
        # 放回一个
        await rdb.lpush(QUEUE_MATCH, raw2)
        return None, None
    return u1, u2

# 在聊天室中发布内容
async def publish_chat(game_id: uuid.UUID, message: dict | str):
    # 1️⃣ 计算频道 —— 需要 sender/recipient，所以拿 dict 版本
    sender = message["sender"] if isinstance(message, dict) else "I"
    recipient = message["recipient"] if isinstance(message, dict) else "A"

    channel = f"room:{game_id}:{sender}_{recipient}"   # ✅ str

    # 2️⃣ 准备 payload —— 确保只序列化一次
    if isinstance(message, str):        # 已是 JSON 字符串
        payload = message
    else:                               # dict → JSON
        payload = serialize_message(message)   # 内部一次 json.dumps

    await rdb.publish(channel, payload)        # ✅ message 是 str

# 设定房间状态 房间开始启用--->房间有效期失效
async def set_room_state(game_id: str, **kv):
    key = f"room:{game_id}:state"
    await rdb.hset(key, mapping=kv)
    await rdb.expire(key, 1800)

# 序列化消息的工具函数
def serialize_message(message: dict) -> str:
    """将包含 datetime 的消息字典转换为 JSON 字符串"""
    def default(o):
        if isinstance(o, dt.datetime):
            return o.isoformat()
        raise TypeError(f"Type {type(o)} not serializable")

    return json.dumps(message, ensure_ascii=False)



