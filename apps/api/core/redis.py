import os, json, uuid, time
import redis.asyncio as redis  # 👈 统一用 redis.asyncio
import datetime as dt

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:16379/0")
rdb: redis.Redis = redis.from_url(REDIS_URL, decode_responses=True)  # decode_responses=True 省去手动 .decode()

QUEUE_INTERROGATOR = "queue:interrogator"
QUEUE_WITNESS      = "queue:witness"

async def push_queue(queue: str, user_id: uuid.UUID, elo: int):
    user_key = f"user:{user_id}"

    # ❌ 防止重复加入两个队列
    other_queue = QUEUE_WITNESS if queue == QUEUE_INTERROGATOR else QUEUE_INTERROGATOR
    if await rdb.zscore(other_queue, user_key):
        print(f"⚠️ 用户 {user_id} 已在另一队列中，忽略加入 {queue}")
        return

    score = int(time.time()) + elo // 100
    await rdb.zadd(queue, {user_key: score})


# 匹配测试对局
async def pop_match():
    i = await rdb.zpopmax(QUEUE_INTERROGATOR, count=1)
    w = await rdb.zpopmax(QUEUE_WITNESS, count=1)

    if not i or not w:
        return None, None

    iid = i[0][0].split(":")[1]
    wid = w[0][0].split(":")[1]

    # 🚫 禁止自己匹配自己
    if iid == wid:
        print(f"❌ 匹配失败：同一个玩家被匹配到了自己！id={iid}")
        # 可选：重新放回 witness 队列
        score = int(time.time()) + 11  # 给个新 score，防止无限被 pop
        await rdb.zadd(QUEUE_WITNESS, {f"user:{wid}": score})
        return None, None

    return iid, wid


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

async def log_queue_state():
    i_list = await rdb.zrange(QUEUE_INTERROGATOR, 0, -1)
    w_list = await rdb.zrange(QUEUE_WITNESS, 0, -1)
    print("🧾 Interrogator Queue:", i_list)
    print("🧾 Witness Queue:", w_list)


