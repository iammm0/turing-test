from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field


class Settings(BaseSettings):
    """
    统一读取根目录 .env 的后端配置
    ---------------------------------
    - 缺省值全部 None；若必须提供，可去掉 `| None` 并在 .env 写值
    - `extra = "ignore"` 允许 .env 中出现 NEXT_PUBLIC_* 而不会报错
    """

    # -------- PostgreSQL --------
    POSTGRES_HOST: str = Field(alias="POSTGRES_HOST")
    POSTGRES_PORT: int = Field(alias="POSTGRES_PORT")
    POSTGRES_USER: str = Field(alias="POSTGRES_USER")
    POSTGRES_PASSWORD: str = Field(alias="POSTGRES_PASSWORD")
    POSTGRES_DB: str = Field(alias="POSTGRES_DB")

    # -------- Redis --------
    REDIS_URL: str = Field(alias="REDIS_URL")

    # -------- 其它（例如 LLM） --------
    DEEPSEEK_API_KEY: str = Field(alias="DEEPSEEK_API_KEY")

    # ----- 派生属性，方便其他模块直接拿 URL -----
    @property
    def database_url(self) -> str:
        """
        返回完整的 SQLAlchemy 异步连接 URL，
        其他模块只需 import settings.database_url 即可。
        """
        return (
            f"postgresql+asyncpg://"
            f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/"
            f"{self.POSTGRES_DB}"
        )

    @property
    def redis_url(self) -> str:
        """
        返回 Redis 连接 URL，供所有使用 redis 的地方直接引用。
        """
        return self.REDIS_URL

    # ----- pydantic-settings V2 配置 -----
    model_config = ConfigDict(
        env_file=".env",              # 根目录 .env
        env_file_encoding="utf-8",
        extra="ignore",               # 忽略未声明变量
        case_sensitive=True,          # 严格区分大小写
        populate_by_name=True,        # 支持字段名或 alias 二选一
    )


# 在模块加载时就实例化一个单例，供全局引用
settings = Settings()
