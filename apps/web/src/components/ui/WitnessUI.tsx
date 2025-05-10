"use client";
import { useState } from "react";
import { SenderRole } from "@/lib/types";
import ChatInput from "./ChatInput";
import ChatBubble from "./ChatBubble";

type Props = {
  role: SenderRole;
  messages: any[];
  status: string;
  sendMessageAction: (recipient: SenderRole, body: string) => void;
};

export default function WitnessUI({ role, messages, status, sendMessageAction }: Props) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessageAction(SenderRole.I, input.trim());
    setInput("");
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          {role === "H" ? "🧍‍♂️ 您是人类证人" : "🤖 您是 AI"}
        </h2>
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
              isOwn={m.sender === role}
            />
          ) : null
        )}
      </div>

      <ChatInput role={role} input={input} setInput={setInput} onSend={handleSend} />
    </div>
  );
}
