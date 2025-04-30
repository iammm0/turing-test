import json
import os
from abc import ABC
from pathlib import Path
from typing import Sequence, Dict, Union

import httpx

from apps.api.dao.message import Message
from apps.api.service.prompt_builders.prompt_builder import PromptBuilder


# —— 通用聊天客户端基类 ——
class GenericChatClient(ABC):
    """
    提供多模型、多密钥、多端点的聊天补全接口抽象
    """
    def __init__(
        self,
        prompt_builder: PromptBuilder,
        model: str,
        api_key: str,
        base_url: str,
        endpoint: str,
        system_prompt_path: Union[str, Path, None] = None
    ):
        self.prompt_builder = prompt_builder
        self.model = model
        self.base_url = base_url.rstrip('/')
        self.endpoint = endpoint if endpoint.startswith('/') else f"/{endpoint}"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type":  "application/json",
        }
        # 加载 system prompt
        if system_prompt_path is None:
            project_root = Path(__file__).resolve().parents[3]
            system_prompt_path = project_root / "prompts" / "system.json"
        else:
            system_prompt_path = Path(system_prompt_path)
        with system_prompt_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        sys_prompt = data.get("prompt")
        if not isinstance(sys_prompt, str):
            raise ValueError("system.json 中必须包含 string 类型的 `prompt` 字段")
        self.system_prompt = {"role": "system", "content": sys_prompt}

    async def complete(
        self,
        history: Sequence[Message],
        user_input: str,
        temperature: float = 1.0,
        max_tokens: int = 256,
    ) -> str:
        # 构建完整 messages 列表
        messages = [self.system_prompt]
        messages.extend(self.prompt_builder.build(list(history), user_input))
        payload: Dict = {
            "model":       self.model,
            "messages":    messages,
            "temperature": temperature,
            "max_tokens":  max_tokens,
        }
        # 异步发送请求
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30, follow_redirects=True) as client:
            resp = await client.post(self.endpoint, json=payload, headers=self.headers)
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"]

    async def chat_reply(
        self,
        history: Sequence[Message],
        user_input: str,
        temperature: float = 1.3,
        max_tokens: int = 20,
    ) -> str:
        return await self.complete(history, user_input, temperature, max_tokens)

# —— 具体服务客户端示例 ——
class DeepSeekClient(GenericChatClient):
    def __init__(
        self,
        prompt_builder: PromptBuilder,
        api_key: str = os.getenv("DEEPSEEK_API_KEY", "sk-5399ca53700149b49e7830e6bdb4f5cf"),
        system_prompt_path: Union[str, Path, None] = None,
    ):
        super().__init__(
            prompt_builder=prompt_builder,
            model="deepseek-chat",
            api_key=api_key,
            base_url="https://api.deepseek.com",
            endpoint="/v1/chat/completions",
            system_prompt_path=system_prompt_path,
        )

class Grok3Client(GenericChatClient):
    def __init__(
        self,
        prompt_builder: PromptBuilder,
        api_key: str,
        system_prompt_path: Union[str, Path, None] = None,
    ):
        super().__init__(
            prompt_builder=prompt_builder,
            model="grok-3",
            api_key=api_key,
            base_url="https://api.claudeplus.top/v1",
            endpoint="/chat/completions",
            system_prompt_path=system_prompt_path,
        )

# —— 使用示例 ——
# from apps.api.service.deepseek_service import DeepSeekClient
# from apps.api.service.grok_service import Grok3Client
# client = DeepSeekClient(prompt_builder)
# response = await client.chat_reply(history, "Hello")

# client2 = Grok3Client(prompt_builder, api_key="YOUR_GROK3_KEY")
# response2 = await client2.chat_reply(history, "Tell me a joke")
