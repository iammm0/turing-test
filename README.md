# turing_test 开发文档

## 一、项目简介
- 背景与动机  

- 核心功能概览  

- 应用场景  

  

## 二、技术栈
- 后端：FastAPI / SQLAlchemy / asyncpg / Redis / OAuth2 / WebSocket  
- 前端：Next.js / React / MUI / React Query / WebSocket  
- 数据库：PostgreSQL  
- 缓存与消息：Redis  
- 部署：Uvicorn / Docker / Nginx  



## 三、项目结构

```
.
├── apps
│   ├── api
│   │   ├── routers       # HTTP + WS 路由
│   │   ├── db            # ORM model
│   │   ├── core          # 配置、数据库、Redis、lifespan
│   │   └── utils         # 鉴权、序列化
│   └── migrations        # Alembic 迁移文件
├── frontend
│   ├── components        # 通用 UI 组件
│   ├── hooks             # React Query hooks
│   ├── lib               # API 封装
│   └── app/queue         # 排队页面
├── .env(.local)          # 环境变量模板
├── alembic.ini
├── README.md
└── docker-compose.yml
```



## 四、本地数据库环境准备

启动 PostgreSQL 使用自定义端口：

```cmd
:: 启动 PostgreSQL（端口改为 15432）
docker run -d --name turing_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=iammm -e POSTGRES_DB=turing_test -p 15432:5432 postgres
```

启动 Redis 容器 使用自定义端口：

```cmd
:: 启动 Redis（端口改为 16379）
docker run -d --name turing_redis -p 16379:6379 redis
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



## 五、快速开始

1.克隆代码：

```bash
git clone https://.../turing-test.git
cd turing-test
```

2.环境变量：

在项目根目录创建 `.env`（或 `.env.local`），填写：

```bash
POSTGRES_HOST=…
POSTGRES_PORT=5432
POSTGRES_USER=…
POSTGRES_PASSWORD=…
POSTGRES_DB=…
REDIS_URL=redis://localhost:6379/0
NEXT_PUBLIC_WS_BASE=ws://localhost:8000/api
```

3. 后端依赖 & 启动

```bash
cd apps/api
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

4.  前端依赖 & 启动

```bash
cd frontend
npm install
npm run dev
```



## 六、核心功能

1.  用户认证

注册 `/api/auth/register`

登录 `/api/auth/login`

JWT 令牌管理 (有效期 30 天)



2. 匹配系统

握手：`ws://…/api/ws/match?token=…`

```
join`→`match_found`→`accept/decline`→`matched
```



3. 游戏流程

玩家确认后创建 `Game`

不同状态：`WAITING`→`ACTIVE`→`CHAT`→`JUDGED`→`ENDED`



## 七、API 文档

1. ### HTTP Endpoints

| 方法 |         路径          |      描述      |
| :--: | :-------------------: | :------------: |
| POST |  /api/auth/register   |    用户注册    |
| POST |    /api/auth/login    |    用户登录    |
| POST | /api/rooms/{id}/guess | 审讯者提交判定 |

2. ### WebSocket 消息格式

#### -客户端→服务端

```json
{ "action": "join" }
```

接受进入对局

```json
{ "action": "accept", "match_id": "..." }
```

拒绝进入对局

```json
{ "action": "decline", "match_id": "..." }
```

#### -服务端→客户端

对局匹配成功

```json
{ "action": "match_found", "match_id": "...", "role": "I|W", "window": 60 }
```

系统已经为玩家匹配到对局，等待玩家确认

```json
{ "action": "matched", "game_id": "..." }
```

对局等待玩家响应超时，玩家从匹配队列长链接中断开

```
{ "action": "error",   "detail": "..." }
```

