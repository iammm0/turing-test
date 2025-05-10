"use client";
import { SenderRole } from "@/lib/types";

type ChatInputProps = {
  role: SenderRole;
  input: string;
  setInput: (value: string) => void;
  canGuess?: boolean;
  onSend: () => void;
};

export default function ChatInput({ role, input, setInput, canGuess = false, onSend }: ChatInputProps) {
  if (canGuess && role === "I") return null; // 审讯者聊天结束后不再显示聊天输入

  return (
    <div className="flex gap-2 mt-2">
      <input
        className="flex-1 border rounded p-2"
        placeholder="输入消息…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onSend}>发送</button>
    </div>
  );
}
