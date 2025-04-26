from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from apps.api.routers import tests_database, matchmaker, chat, guess, ai_test
from apps.api.utils.lifespan import lifespan

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # 如果以后有正式域名，添加到这里
]

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
app.include_router(tests_database.router)
app.include_router(matchmaker.router, prefix="/api")
app.include_router(chat.router,        prefix="/api")
app.include_router(guess.router,       prefix="/api")
app.include_router(ai_test.router, prefix="/api")