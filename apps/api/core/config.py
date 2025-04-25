from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL 配置
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    # DeepSeek API 密钥
    DEEPSEEK_API_KEY: str

    # Redis配置
    REDIS_URL: str

    class Config:
        env_file = ".env"

settings = Settings()