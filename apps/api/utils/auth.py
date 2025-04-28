import datetime
import datetime as dt
import uuid
from datetime import timedelta
from typing import cast

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, ExpiredSignatureError
from passlib.context import CryptContext
from passlib.exc import InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.dao.user import User

# 👇 随机字符串（只在服务端安全储存）
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 设置有效期为 30 天

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed: str) -> bool:
    return pwd_context.verify(plain_password, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)):
    to_encode = data.copy()
    expire = dt.datetime.now(datetime.timezone.utc) + expires_delta
    to_encode.update({"exp": expire})  # 添加过期时间
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 解码 token 的函数
def decode_token(token: str):
    try:
        # 尝试解码 token 并获取 payload
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token decoding error: {str(e)}")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:  # 返回 User 实例，而不是 Type[User]

    # 1️⃣ 解码并校验 token
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="无效的认证凭据")

    # 2️⃣ 转换成 UUID
    try:
        user_id = uuid.UUID(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="无效的用户 ID")

    # 3️⃣ 异步地从数据库拿到 User 实例
    user = await db.get(User, user_id)
    user = cast(User, user)  # 告诉类型检查器：这个确实是 User
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")

    return user
