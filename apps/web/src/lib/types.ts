import {Recipient, Sender} from "@/types";

export enum SenderRole {
  I = "I",
  A = "A",
  H = "H",
}

export type MessagePacket =
  | ChatMessage
  | GuessMessage
  | GuessResultMessage
  | SystemMessage;

export type MatchCommandMessage =
  | JoinMessage
  | LeaveMessage
  | AcceptMessage
  | DeclineMessage;

export type MatchEventMessage =
  | MatchFoundMessage
  | MatchedMessage
  | TimeoutMessage
  | ErrorMessage;

export type BaseMessage = {
  ts: string; // 时间戳 ISO 字符串
};

// 匹配指令
export type JoinMessage = BaseMessage & {
  action: "join";
};

export type LeaveMessage = BaseMessage & {
  action: "leave";
};

export type AcceptMessage = BaseMessage & {
  action: "accept";
  match_id: string;
};

export type DeclineMessage = BaseMessage & {
  action: "decline";
  match_id: string;
};

// 匹配事件
export type MatchFoundMessage = BaseMessage & {
  action: "match_found";
  match_id: string;
  role: SenderRole;
  window: number;
};

export type MatchedMessage = BaseMessage & {
  action: "matched";
  game_id: string;
};

export type TimeoutMessage = BaseMessage & {
  action: "timeout";
};

export type ErrorMessage = BaseMessage & {
  action: "error";
  detail?: string;
};

// 游戏中消息
export type ChatMessage = BaseMessage & {
  action: "message";
  sender: Sender;
  recipient: Recipient;
  body: string;
};
export type GuessMessage = BaseMessage & {
  action: "guess";
  sender: "I";
  recipient: "server";
  suspect_ai_id: string;
  suspect_human_id: string;
  interrogator_id: string;
};
export type GuessResultMessage = BaseMessage & {
  action: "guess_result";
  is_correct: boolean;
};
export type SystemMessage = BaseMessage & {
  action: "chat_ended";
};