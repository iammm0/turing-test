import os, json, uuid, time
import redis.asyncio as redis  # 👈 统一用 redis.asyncio
import datetime as dt

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:16379/0")
rdb: redis.Redis = redis.from_url(REDIS_URL, decode_responses=True)  # decode_responses=True 省去手动 .decode()

QUEUE_INTERROGATOR = "queue:interrogator"
QUEUE_WITNESS      = "queue:witness"

async def push_queue(queue: str, user_id: uuid.UUID, elo: int):
    score = int(time.time()) + elo // 100
    await rdb.zadd(queue, {f"user:{user_id}": score})

# 匹配测试对局
async def pop_match():
    i = await rdb.zpopmax(QUEUE_INTERROGATOR, count=1)
    w = await rdb.zpopmax(QUEUE_WITNESS,      count=1)
    if i and w:
        return i[0][0].split(":")[1], w[0][0].split(":")[1]
    return None, None

# 在聊天室中发布内容
async def publish_chat(game_id: uuid.UUID, message: dict):
    channel = f"room:{game_id}:{message['sender']}_{message['recipient']}"
    await rdb.publish(channel, json.dumps(serialize_message(message), ensure_ascii=False))

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

    return json.dumps(message, default=default)

