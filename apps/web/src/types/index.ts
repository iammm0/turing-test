export type Sender = "I" | "A" | "H";

export type Recipient = "A" | "H";

// 单条聊天消息结构
export type Msg = {
  sender: Sender;
  recipient: Recipient;
  body: string;
  ts: string; // ISO 时间戳
};