"use client";
import { useEffect, useRef } from "react";
import {Msg, useRoomStore} from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { connectSocket } from "@/lib/socket";
import {MessageBubble} from "@/components/ui/MessageBubble";

export default function ChatDualPane({ gameId }: { gameId: string }) {
  const { addMessage, messages } = useRoomStore();

  // 建立 WS 两条连接：I/A 与 I/H 各自 WebSocket
  const wsAI = useRef<WebSocket | null>(null);
  const wsH = useRef<WebSocket | null>(null);

  useEffect(() => {
    wsAI.current = connectSocket(gameId, "I");
    wsH.current = connectSocket(gameId, "I");
    const onMsg = (e: MessageEvent) => addMessage(JSON.parse(e.data));
    wsAI.current.addEventListener("message", onMsg);
    wsH.current.addEventListener("message", onMsg);
    return () => {
      wsAI.current?.close(); wsH.current?.close();
    };
  }, [addMessage, gameId]);

  // …UI：左右面板
  return (
    <div className="grid grid-cols-2 gap-4">
      {["A", "H"].map((target) => (
        <div key={target} className="flex flex-col border rounded-lg h-[70vh]">
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {messages
              .filter((m) => (m.sender === "I" && m.recipient === target) || (m.sender === target && m.recipient === "I"))
              .map((m) => <MessageBubble key={m.ts} {...m} self={m.sender === "I"} />)}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const body = (e.currentTarget.elements.namedItem("text") as HTMLTextAreaElement).value;
              const payload = {
                sender: "I" as const,
                recipient: target,
                body
              };
              (target === "A" ? wsAI.current : wsH.current)?.send(JSON.stringify(payload));
              addMessage({ ...payload, ts: new Date().toISOString() } as Msg);
              e.currentTarget.reset();
            }}
            className="p-2 border-t flex gap-2"
          >
            <Textarea name="text" className="flex-1" rows={2} />
            <Button type="submit">→</Button>
          </form>
        </div>
      ))}
    </div>
  );
}
