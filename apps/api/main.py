from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.routers import chat, auth, ws_match
from apps.api.utils.lifespan import lifespan

app = FastAPI(lifespan=lifespan)

# ② —— 全局中间件、CORS 等可在这里添加 ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ③ —— 挂载路由 ---------------------------------
app.include_router(auth.router, prefix="/api")

app.include_router(chat.router,        prefix="/api")

app.include_router(ws_match.router, prefix="/api")