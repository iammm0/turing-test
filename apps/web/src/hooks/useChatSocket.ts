// hooks/useChatSocket.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Msg, Sender } from "@/types";

type Status = "connecting" | "open" | "closed" | "error";

export function useChatSocket(gameId: string, role: Sender) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const wsRef = useRef<WebSocket | null>(null);

  const url = `ws://localhost:8000/ws/rooms/${gameId}/${role}`; // ✅ 替换为部署地址

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus("connecting");

      ws.onopen = () => setStatus("open");
      ws.onclose = () => {
        setStatus("closed");
        reconnectTimeout = setTimeout(connect, 3000); // 自动重连
      };
      ws.onerror = () => setStatus("error");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.body && data?.sender && data?.recipient) {
            setMessages((prev) => [...prev, data as Msg]);
          }
        } catch (err) {
          console.warn("非标准消息格式：", event.data);
        }
      };
    };

    connect();
    return () => {
      ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [url]);

  const sendMessage = useCallback((msg: Omit<Msg, "ts">) => {
    const fullMsg: Msg = {
      ...msg,
      ts: new Date().toISOString(),
    };
    wsRef.current?.send(JSON.stringify(fullMsg));
    setMessages((prev) => [...prev, fullMsg]);
  }, []);

  return {
    messages,
    sendMessage,
    status,
  };
}
