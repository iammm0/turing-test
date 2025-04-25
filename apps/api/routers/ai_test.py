import uuid
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from apps.api.service.deepseek_service import DeepSeekClient

router = APIRouter(prefix="/test/ai", tags=["AI Test"])
llm = DeepSeekClient()


# ---------- Pydantic ---------- #
Role = Literal["system", "user", "assistant"]


class ChatMessage(BaseModel):
    role: Role
    content: str = Field(..., max_length=4000)


class AIRequest(BaseModel):
    message: str = Field(
        ..., description="本次想问 AI 的内容（必填）", max_length=2000
    )
    history: Optional[List[ChatMessage]] = Field(
        default=None,
        description="上下文历史，可选；最多 10 条，按先后顺序",
        max_items=10,
    )
    temperature: float = Field(default=0.7, ge=0.0, le=1.5)
    max_tokens: int = Field(default=256, ge=1, le=2048)


class AIResponse(BaseModel):
    id: uuid.UUID
    reply: str


# ---------- 路由 ---------- #
@router.post("/", response_model=AIResponse, summary="简单测试 DeepSeek 是否正常回应")
async def chat_test(body: AIRequest):
    """不走游戏逻辑；只把给定 prompt + 可选历史发给 DeepSeek，返回回复文本"""

    # 组装 messages
    messages: List[dict] = [{"role": "system", "content": "你是测试机器人，应简短回答"}]
    if body.history:
        messages.extend([m.model_dump() for m in body.history])
    messages.append({"role": "user", "content": body.message})

    try:
        reply_text: str = await llm.complete(
            messages=messages,
            temperature=body.temperature,
            max_tokens=body.max_tokens,
        )
    except Exception as e:  # DeepSeek 网络/配额异常
        raise HTTPException(status_code=502, detail=f"LLM 调用失败: {e}")

    return AIResponse(id=uuid.uuid4(), reply=reply_text)