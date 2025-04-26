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

    # -------- LLM / 其它 --------
    DEEPSEEK_API_KEY: str = Field(alias="DEEPSEEK_API_KEY")

    # ----- pydantic-settings V2 配置 -----
    model_config = ConfigDict(
        env_file=".env",  # 根目录 .env (local/dev/prod 皆可)
        env_file_encoding="utf-8",
        extra="ignore",  # 忽略未声明变量，防止将来加新变量报错
        case_sensitive=True,  # 大小写严格区分
        populate_by_name=True,  # 允许字段名或 alias 二选一（这里两者一致）
    )


# 单例
settings = Settings()