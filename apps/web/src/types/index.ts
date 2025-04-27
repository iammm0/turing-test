export type Sender = "I" | "A" | "H";
export type Recipient = "I" | "A" | "H";

export type Msg = {
  sender: Sender;
  recipient: Recipient;
  body: string;
  ts: string;
};

// 合法的发送消息结构
export type OutgoingMsg =
  | { sender: "I"; recipient: "A" | "H"; body: string } // I 可以发给 A 或 H
  | { sender: "A"; recipient: "I"; body: string }       // A 只能发给 I
  | { sender: "H"; recipient: "I"; body: string };      // H 只能发给 I
