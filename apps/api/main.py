from fastapi import FastAPI

from apps.api.routers import tests_database, matchmaker, chat, guess, ai_test
from apps.api.utils.lifespan import lifespan

app = FastAPI(lifespan=lifespan)

# ② —— 全局中间件、CORS 等可在这里添加 ----------

# ③ —— 挂载路由 ---------------------------------
app.include_router(tests_database.router)
app.include_router(matchmaker.router, prefix="/api")
app.include_router(chat.router,        prefix="/api")
app.include_router(guess.router,       prefix="/api")
app.include_router(ai_test.router, prefix="/api")