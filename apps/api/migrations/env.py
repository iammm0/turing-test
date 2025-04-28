from __future__ import annotations
from __future__ import with_statement

import os
import sys, pathlib

from dotenv import load_dotenv

from apps.api.dao.base import Base

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.append(str(ROOT))   # 把 turing-test 加到 sys.path


# -*- coding: utf-8 -*-
# mypy: ignore-errors


import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from apps.api.core.database import DATABASE_URL

# 假设 alembic/ 在项目根的子目录
BASE = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE, ".env"))

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata

# 动态注入 URL
config.set_main_option("sqlalchemy.url", DATABASE_URL)

def run_migrations_offline() -> None:
    """Offline: 生成 SQL 脚本"""
    context.configure(
        url=DATABASE_URL.replace("+asyncpg", "+psycopg2"),  # 用同步驱动
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Online: 真跑到 DB（异步）"""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),  # 读取 sqlalchemy.url
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())

