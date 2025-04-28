import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.dao.user import User
from apps.api.dto.user import UserCreate, UserOut
from apps.api.utils.auth import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
async def register_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # 检查邮箱是否已存在
    existing_user = await db.execute(
        select(User).where(User.email == data.email)
    )
    existing_user = existing_user.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    if not data.password:
        raise HTTPException(400, "密码不能为空")

    # 这里可以加一些密码强度检查
    hashed_password = get_password_hash(data.password)
    user = User(
        id=uuid.uuid4(),
        email=data.email,
        display_name=data.display_name or "匿名玩家",
        password_hash=hashed_password
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # 确保提供了用户名和密码
    if not form_data.username or not form_data.password:
        raise HTTPException(status_code=400, detail="用户名和密码不能为空")

    # 查询用户
    q = await db.execute(
        select(User).where(User.email == form_data.username)
    )
    user = q.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(401, detail="用户名或密码错误")

    # 生成JWT令牌，设置过期时间为1小时（可根据需求调整）
    token = create_access_token(data={"sub": str(user.id)}, expires_delta=timedelta(hours=1))
    return {"access_token": token, "token_type": "bearer"}

