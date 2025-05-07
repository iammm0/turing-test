"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Sender } from "@/types";
import {ChatMessage, GuessMessage, MessagePacket} from "@/lib/types";

type Status = "connecting" | "open" | "closed" | "error";

export function useChatSocket(gameId: string, role: Sender) {
  const [messages, setMessages] = useState<MessagePacket[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const wsRef = useRef<WebSocket | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
  const url = `ws://localhost:8000/ws/rooms/${gameId}/${role}?token=${token}`;

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
          const data: MessagePacket = JSON.parse(event.data);
          setMessages((prev) => [...prev, data]);
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

  const sendMessage = useCallback((msg: Omit<ChatMessage, "ts"> | GuessMessage) => {
    const fullMsg = {
    ...msg,
    ts: new Date().toISOString(),
  } as MessagePacket;

    wsRef.current?.send(JSON.stringify(fullMsg));
    setMessages((prev) => [...prev, fullMsg]);
  }, []);

  return {
    messages,
    sendMessage,
    status,
  };
}
