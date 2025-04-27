from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.orm import declarative_base
from redis.asyncio import Redis
from .config import settings

# --------------------- PostgreSQL (async) ---------------------
DATABASE_URL = (
    f"postgresql+asyncpg://{settings.POSTGRES_USER}:"
    f"{settings.POSTGRES_PASSWORD}@"
    f"{settings.POSTGRES_HOST}:"
    f"{settings.POSTGRES_PORT}/"
    f"{settings.POSTGRES_DB}"
)

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)

# 采用 fastApi 的异步特性构建会话
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,      # 常用配置
)

Base = declarative_base()

# FastAPI 依赖
async def get_db() -> AsyncSession:       # 返回值注解更直观
    async with AsyncSessionLocal() as session:
        yield session # yield 后自动 close()

# --------------------- Redis ---------------------
redis_client: Redis = Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)

# 可选 FastAPI 依赖；不再每次关闭全局连接
async def get_redis() -> Redis:
    yield redis_client

