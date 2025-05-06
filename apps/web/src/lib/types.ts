import {Recipient, Sender} from "@/types";

export enum SenderRole {
  I = "I",
  A = "A",
  H = "H",
}

export type BaseMessage = {
  ts: string; // 时间戳 ISO 字符串
};

// ① 聊天消息（双向交流）
export type ChatMessage = BaseMessage & {
  action: "message";
  sender: Sender;
  recipient: Recipient;
  body: string;
};

// ② 猜测消息（系统向后端发起）
export type GuessMessage = {
  action: "guess";
  sender: "I";
  recipient: "server";
  suspect_ai_id: string;
  suspect_human_id: string;
  interrogator_id: string;
};

// ③ 结果消息（后端返回）
export type GuessResultMessage = {
  action: "guess_result";
  is_correct: boolean;
};

// 💡 后续系统消息（如 chat_ended 等）也可加进去
export type SystemMessage = {
  action: "chat_ended";
};

export type MessagePacket =
  | ChatMessage
  | GuessMessage
  | GuessResultMessage
  | SystemMessage;