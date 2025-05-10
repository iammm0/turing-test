from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field
from typing import Optional

class Settings(BaseSettings):
    # —— 支持从单一环境变量 DATABASE_URL ——
    DATABASE_URL: Optional[str] = Field(None, env="DATABASE_URL")

    # -------- 兼容老的拆分式配置 --------
    POSTGRES_HOST: Optional[str]     = Field(None, env="POSTGRES_HOST")
    POSTGRES_PORT: Optional[int]     = Field(None, env="POSTGRES_PORT")
    POSTGRES_USER: Optional[str]     = Field(None, env="POSTGRES_USER")
    POSTGRES_PASSWORD: Optional[str] = Field(None, env="POSTGRES_PASSWORD")
    POSTGRES_DB: Optional[str]       = Field(None, env="POSTGRES_DB")

    REDIS_URL: str                    = Field(...,   env="REDIS_URL")
    DEEPSEEK_API_KEY: str             = Field(...,   env="DEEPSEEK_API_KEY")

    @property
    def database_url(self) -> str:
        # 优先使用完整的 DATABASE_URL
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # 否则回退到拆分式拼接
        return (
            f"postgresql+asyncpg://"
            f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/"
            f"{self.POSTGRES_DB}"
        )

    @property
    def redis_url(self) -> str:
        return self.REDIS_URL

    model_config = ConfigDict(
        # 开发时从 .env 读，生产没挂 .env 则直接跳过
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
        populate_by_name=True,
    )

settings = Settings()
