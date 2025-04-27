import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.models.schemas import UserCreate, UserOut, GameOut
from apps.api.service.user_service import UserService

router = APIRouter(prefix="/user", tags=["user"])

# 创建 UserService 实例
user_service = UserService(get_db)

# 获取用户的游戏历史记录
@router.get("/{user_id}/games", response_model=list[GameOut], summary="获取用户的游戏历史")
async def get_user_game_history(user_id: uuid.UUID):
    games = await user_service.get_user_game_history(user_id)
    if not games:
        raise HTTPException(status_code=404, detail="No games found for this user")
    return games

# 获取用户详细信息
@router.get("/{user_id}", response_model=UserOut, summary="获取用户详情")
async def get_user(user_id: uuid.UUID):
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# 更新用户信息
@router.put("/{user_id}", response_model=UserOut, summary="更新用户信息")
async def update_user(user_id: uuid.UUID, user_data: UserCreate):
    updated_user = await user_service.update_user(user_id, **user_data.dict())
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

# 删除用户
@router.delete("/{user_id}", summary="删除用户")
async def delete_user(user_id: uuid.UUID):
    deleted = await user_service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}
