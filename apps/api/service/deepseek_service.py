import json
import os
from pathlib import Path
from typing import Sequence, List, Dict, Union

import httpx

from apps.api.dao.message import Message
from apps.api.service.prompt_builders.prompt_builder import PromptBuilder

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-f64fd4c9d29643b5baa0344619cfd950")
MODEL = "deepseek-chat"
API_BASE = "https://api.deepseek.com"
ENDPOINT = "/v1/chat/completions"

class DeepSeekClient:
    """
    DeepSeekClient 负责：
      1) 在 __init__ 时，从 JSON 文件加载 system prompt
      2) 使用注入的 PromptBuilder 构造完整的 messages 列表
      3) 调用 DeepSeek 的聊天补全接口，并返回纯文本回复
    """

    def __init__(
        self,
        prompt_builder: PromptBuilder,
        system_prompt_path: Union[str, Path, None] = None,
        api_key: str = DEEPSEEK_API_KEY,
    ):
        self.prompt_builder = prompt_builder

        # 构造 HTTP 头
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type":  "application/json",
        }

        # —— 加载 system prompt JSON ——
        # 默认路径：<project_root>/prompts/system.json
        if system_prompt_path is None:
            # __file__ 在 apps/api/service/deepseek_service.py
            project_root = Path(__file__).resolve().parents[3]
            system_prompt_path = project_root / "prompts" / "system.json"
        else:
            system_prompt_path = Path(system_prompt_path)

        try:
            with system_prompt_path.open("r", encoding="utf-8") as f:
                data = json.load(f)
            # 假设 JSON 格式为 { "prompt": "你是……" }
            sys_prompt = data.get("prompt")
            if not isinstance(sys_prompt, str):
                raise ValueError("system.json 中必须包含 string 类型的 `prompt` 字段")
            # 存为第一个 message
            self.system_prompt = {"role": "system", "content": sys_prompt}
        except Exception as e:
            raise RuntimeError(f"加载 system prompt 失败 ({system_prompt_path}): {e}")

    async def complete(
        self,
        history: Sequence[Message],
        user_input: str,
        temperature: float = 1.3,
        max_tokens: int = 15,
    ) -> str:
        """
        完整接口：给定 ORM history + 本轮用户输入
        1) messages = [ system_prompt ] + prompt_builder.build(...)
        2) POST 到 DeepSeek 接口
        3) 返回 choices[0].message.content
        """

        # —— 1. 强制把 history 转成 list，以便 prompt_builder.build 接受 ——
        history_list = list(history)

        # —— 2. 拼接所有 messages ——
        messages: List[Dict[str, str]] = [self.system_prompt]
        messages.extend(self.prompt_builder.build(history_list, user_input))

        payload = {
            "model":       MODEL,
            "messages":    messages,
            "temperature": temperature,
            "max_tokens":  max_tokens,
        }

        # —— 3. 发请求 ——
        async with httpx.AsyncClient(
            base_url=API_BASE,
            timeout=30,
            follow_redirects=True,
        ) as client:
            resp = await client.post(ENDPOINT, json=payload, headers=self.headers)
            resp.raise_for_status()
            data = resp.json()

        # —— 4. 取出回复文本 ——
        return data["choices"][0]["message"]["content"]

    async def chat_reply(
        self,
        history: Sequence[Message],
        user_input: str,
        temperature: float = 1.3,
        max_tokens: int = 15,
    ) -> str:
        """
        便捷别名，直接调用 complete
        """
        return await self.complete(history, user_input, temperature, max_tokens)