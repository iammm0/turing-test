import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from apps.api.service.llm_service import Grok3Client
from apps.api.service.prompt_builders.prompt_builder import PromptBuilder, make_prompt_builder

router = APIRouter()

class Grok3TestRequest(BaseModel):
    prompt: str
    temperature: float = 1.0
    max_tokens: int = 256

class Grok3TestResponse(BaseModel):
    response: str

@router.post("/grok3/test", response_model=Grok3TestResponse)
async def grok3_test(req: Grok3TestRequest):
    # 1. 初始化客户端
    prompt_builder = make_prompt_builder()
    client = Grok3Client(
        prompt_builder=prompt_builder,
        api_key=os.getenv("GROK3_API_KEY", "sk-ykFU3QyxG9LpZdLRe4acHdKvQFVBWmUQbeqDBolLq14CdhK0")
    )

    try:
        # 2. 调用 chat_reply（这里不带历史，只传本次 prompt）
        result = await client.chat_reply(
            history=[],
            user_input=req.prompt,
            temperature=req.temperature,
            max_tokens=req.max_tokens
        )
        return {"response": result}

    except httpx.HTTPStatusError as e:
        # 3. 捕获 HTTP 错误并提取 xAI 的原始返回
        status = e.response.status_code
        # 尝试解析 JSON，否则直接读文本
        try:
            error_body = e.response.json()
        except ValueError:
            error_body = e.response.text

        # 4. 返回 400 时，将 xAI 的错误和你的请求 payload 一并返回
        #    （注意：GenericChatClient 中已将最后一次的 payload 存到 client.last_payload）
        detail = {
            "xai_status": status,
            "xai_error": error_body,
            "model": client.model,
            "sent_payload": getattr(client, "last_payload", "<none>")
        }

        # 返回 400~499，说明请求非法
        if 400 <= status < 500:
            raise HTTPException(status_code=status, detail=detail)

        # 返回 500 及以上，说明是服务端错误（可能是密钥过期、服务挂了等）
        raise HTTPException(
            status_code=502,  # 使用 502 更明确地表示“后端服务失败”
            detail={
                "message": "后端 LLM 接口异常，请稍后重试。",
                **detail
            }
        )

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "无法连接到 LLM 接口服务",
                "reason": str(e),
                "endpoint": client.endpoint,
                "model": client.model
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "发生未知错误",
                "error": str(e),
                "model": client.model
            }
        )
