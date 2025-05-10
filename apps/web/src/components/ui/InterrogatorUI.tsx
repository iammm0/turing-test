"use client";
import { useEffect, useState } from "react";
import { SenderRole } from "@/lib/types";
import { decodeJwt } from "@/lib/auth";
import ChatBubble from "./ChatBubble";
import ChatInput from "@/components/ui/ChatInput";

type Props = {
  role: SenderRole;
  messages: any[];
  status: string;
  sendMessageAction: (recipient: SenderRole, body: string) => void;
  sendGuessAction: (aiId: string, huId: string) => void;
};

export default function InterrogatorUI({ role, messages, status, sendMessageAction, sendGuessAction }: Props) {
  const [input, setInput] = useState("");
  const [guessAiId, setGuessAiId] = useState("");
  const [guessHuId, setGuessHuId] = useState("");
  const [canGuess, setCanGuess] = useState(false);

  useEffect(() => {
    if (messages.some((m) => m.action === "chat_ended")) {
      setCanGuess(true);
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessageAction(SenderRole.H, input.trim());
    setInput("");
  };

  const handleGuess = () => {
    const token = localStorage.getItem("access_token");
    const decoded = token ? decodeJwt(token) : null;
    const userId = decoded?.sub;
    if (!userId) {
      console.warn("⚠️ Token 无效");
      return;
    }
    sendGuessAction(guessAiId, guessHuId);
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🕵️‍♂️ 您是审讯者</h2>
        <span className="text-sm flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === "open" ? "bg-green-500" : "bg-gray-400"}`} />
          {status}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-white shadow-sm mb-2">
        {messages.map((m, i) =>
          "body" in m ? (
            <ChatBubble
              key={i}
              sender={m.sender}
              recipient={m.recipient}
              body={m.body}
              ts={m.ts}
              isOwn={m.sender === "I"}
            />
          ) : null
        )}
      </div>

      <ChatInput role={role} input={input} setInput={setInput} canGuess={canGuess} onSend={handleSend} />

      {canGuess && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">🔍 猜测结果：</p>
          <input
            className="w-full border rounded p-2"
            placeholder="AI 的用户 ID"
            value={guessAiId}
            onChange={(e) => setGuessAiId(e.target.value)}
          />
          <input
            className="w-full border rounded p-2"
            placeholder="Human 的用户 ID"
            value={guessHuId}
            onChange={(e) => setGuessHuId(e.target.value)}
          />
          <button
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
            onClick={handleGuess}
          >
            提交猜测
          </button>
        </div>
      )}
    </div>
  );
}
