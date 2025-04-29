import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.dto.user import UserOut, UserCreate
from apps.api.service.user_service import UserService

router = APIRouter(prefix="/user", tags=["user"])

# 获取用户详细信息
@router.get("/{user_id}", response_model=UserOut, summary="获取用户详情")
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),            # 注入 AsyncSession
):
    user_service = UserService(db)                 # 构造 Service
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# 更新用户信息
@router.put("/{user_id}", response_model=UserOut, summary="更新用户信息")
async def update_user(
    user_id: uuid.UUID,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),            # 注入 AsyncSession
):
    user_service = UserService(db)                 # 构造 Service
    updated_user = await user_service.update_user(user_id, **user_data.model_dump())
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

# 删除用户
@router.delete("/{user_id}", summary="删除用户")
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),            # 注入 AsyncSession
):
    user_service = UserService(db)                 # 构造 Service
    deleted = await user_service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

