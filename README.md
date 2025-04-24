# turing_test 数据库环境准备

启动 PostgreSQL 使用自定义端口：

```cmd
:: 启动 PostgreSQL（端口改为 15432）
docker run -d ^
 --name turing_postgres ^
 -e POSTGRES_USER=postgres ^
 -e POSTGRES_PASSWORD=iammm ^
 -e POSTGRES_DB=turing_test ^
 -p 15432:5432 ^
 postgres
```

启动 Redis 容器 使用自定义端口：

```cmd
:: 启动 Redis（端口改为 16379）
docker run -d ^
 --name turing_redis ^
 -p 16379:6379 ^
 redis
```

PostgreSQL 容器内登录：

```bash
docker exec -it turing_postgres bash
```

然后在容器里执行：

```bash
psql -U postgres -d turing_test
```

进入 Redis 容器内：

```cmd
docker exec -it turing_redis redis-cli
```

