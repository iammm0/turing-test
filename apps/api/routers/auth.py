import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.dao.user import User
from apps.api.dto.auth import LoginRequest
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
async def login(
        creds: LoginRequest,
        db: AsyncSession = Depends(get_db)
):
    # ① 非空校验
    if not creds.email or not creds.password:
        raise HTTPException(status_code=400, detail="用户名和密码不能为空")

    # ② 查用户
    q = await db.execute(
        select(User).where(User.email == creds.email)
    )
    user = q.scalar_one_or_none()

    # ③ 验证
    if (
            not user
            or not user.password_hash
            or not verify_password(creds.password, user.password_hash)
    ):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    # ④ 签发 JWT（1 小时后过期）
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(hours=1),
    )
    return {"access_token": token, "token_type": "bearer"}

