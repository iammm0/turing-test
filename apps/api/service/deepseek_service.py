import os
from typing import List, Dict

import httpx

DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-5399ca53700149b49e7830e6bdb4f5cf")
BASE_URL = "https://api.deepseek.com/v1/chat/completions"
MODEL = "deepseek-chat"          # 或 deepseek-r1

class DeepSeekClient:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {DEEPSEEK_KEY}",
            "Content-Type": "application/json",
        }

    async def complete(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 150,
    ) -> str:
        payload = {
            "model": MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(
            base_url="https://api.deepseek.com",
            timeout=30,
            follow_redirects=True,
        ) as client:
            r = await client.post("/v1/chat/completions", json=payload, headers=self.headers)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]
