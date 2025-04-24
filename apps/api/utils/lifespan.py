from contextlib import asynccontextmanager
from fastapi import FastAPI

from apps.api.core.database import engine, redis_client
from apps.api.db.models import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ──────────── 🚀 Startup ────────────
    print("📦 正在创建 / 校验 PostgreSQL 表结构…")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)     # ← AsyncEngine 正确写法
    print("✅ PostgreSQL 表已就绪")

    # Redis 连接检查
    print("🔌 正在连接 Redis…")
    try:
        if await redis_client.ping():
            print("✅ Redis 连接成功")
        else:
            print("❌ Redis 无响应")
    except Exception as e:
        print(f"❌ Redis 连接失败: {e}")

    # 让 FastAPI 继续启动
    yield

    # ──────────── 🧹 Shutdown ────────────
    await redis_client.aclose()
    await engine.dispose()                                 # 释放 DB 连接池
    print("🧹 Redis 已关闭，DB Engine 已释放")
