from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from apps.api.core.database import get_db, get_redis

router = APIRouter(prefix="/test", tags=["Health Check"])

# ---------- PostgreSQL ----------
@router.get("/postgres", summary="检查 PostgreSQL 是否正常连接")
async def postgres_check(db: AsyncSession = Depends(get_db)):
    try:
        # async execute & fetch one scalar
        result = await db.execute(text("SELECT 1"))
        _ = result.scalar_one()
        return {"status": "PostgreSQL Connected"}
    except Exception as e:
        return {"status": "Error", "detail": str(e)}

# ---------- Redis ----------
@router.get("/redis", summary="检查 Redis 是否正常连接")
async def redis_check(redis: Redis = Depends(get_redis)):
    try:
        if await redis.ping():
            return {"status": "Redis Connected"}
        return {"status": "Redis Not Responding"}
    except Exception as e:
        return {"status": "Error", "detail": str(e)}

