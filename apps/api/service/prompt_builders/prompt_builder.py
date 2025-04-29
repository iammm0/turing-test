import abc
from typing import Sequence, List, Dict, Optional
from apps.api.dao.message import Message
from apps.api.dao.sender import SenderRole


class PromptBuilder(abc.ABC):
    """
    PromptBuilder 接口：任何一级的 PromptBuilder 都需实现 build()
    """
    @abc.abstractmethod
    def build(
        self,
        history: Sequence[Message],
        user_input: str
    ) -> List[Dict[str, str]]:
        ...


# ———————————— 历史消息提示（最后一层） ————————————
class HistoryPromptBuilder(PromptBuilder):
    def build(
        self,
        history: Sequence[Message],
        user_input: str
    ) -> List[Dict[str, str]]:
        msgs: List[Dict[str, str]] = []
        for m in history:
            role_tag = "user" if m.sender == SenderRole.I else "assistant"
            msgs.append({"role": role_tag, "content": m.body})
        # 最后再加上这一次用户提问
        msgs.append({"role": "user", "content": user_input})
        return msgs


# ———————————— 用户上下文提示（可选层） ————————————
class UserContextPromptBuilder(PromptBuilder):
    def __init__(self, display_name: str):
        self.display_name = display_name

    def build(
        self,
        history: Sequence[Message],
        user_input: str
    ) -> List[Dict[str, str]]:
        return [{
            "role": "system",
            "content": f"当前对话用户昵称：{self.display_name}"
        }]


# ———————————— 房间上下文提示（可选层） ————————————
class RoomContextPromptBuilder(PromptBuilder):
    def __init__(self, room_id: str):
        self.room_id = room_id

    def build(
        self,
        history: Sequence[Message],
        user_input: str
    ) -> List[Dict[str, str]]:
        return [{
            "role": "system",
            "content": f"房间 ID：{self.room_id} —— 请根据房间内规则对话"
        }]


# ———————————— 组合器：把多个 Builder 串起来 ————————————
class CompositePromptBuilder(PromptBuilder):
    def __init__(self, builders: List[PromptBuilder]):
        self.builders = builders

    def build(
        self,
        history: Sequence[Message],
        user_input: str
    ) -> List[Dict[str, str]]:
        result: List[Dict[str, str]] = []
        for b in self.builders:
            result.extend(b.build(history, user_input))
        return result


def make_prompt_builder(
    *,
    display_name: Optional[str] = None,
    room_id: Optional[str]    = None
) -> PromptBuilder:
    """
    动态组装 PromptBuilder：
      - 可选注入用户上下文
      - 可选注入房间上下文
      - 必选历史消息 + 本轮提问
    系统提示词不再在这里注入，由 DeepSeekClient 在调用时自动加载。
    """
    builders: List[PromptBuilder] = []

    # 1. 用户上下文（如果有）
    if display_name:
        builders.append(UserContextPromptBuilder(display_name))

    # 2. 房间上下文（如果有）
    if room_id:
        builders.append(RoomContextPromptBuilder(room_id))

    # 3. 历史对话 + 本轮提问
    builders.append(HistoryPromptBuilder())

    return CompositePromptBuilder(builders)
