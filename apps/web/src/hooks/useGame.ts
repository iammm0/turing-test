import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChatMessage,
  GuessMessage,
  MessagePacket,
  SenderRole,
} from "@/lib/types";
import { jwtDecode } from "jwt-decode";
import {ReadyState, useWebSocket} from "@/lib/socket";

type Status = "connecting" | "open" | "closed" | "error";

export function useGame(
  gameId: string,
  role: SenderRole,
  onGuessResult: (correct: boolean) => void,
  autoReconnect: boolean = true,
  shouldConnect: boolean = true
) {
  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("access_token") : ""),
    []
  );

  const url = shouldConnect && token
    ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8000/api/ws/rooms/${gameId}/${role}?token=${token}`
    : "";

  const interrogatorId = useMemo(() => {
    try {
      return token ? jwtDecode<{ sub: string }>(token).sub : null;
    } catch {
      return null;
    }
  }, [token]);

  const [messages, setMessages] = useState<MessagePacket[]>([]);
  const [status, setStatus] = useState<Status>("connecting");

  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const { sendJson, readyState, isConnected } = useWebSocket<
    MessagePacket,
    MessagePacket
  >({
    url,
    shouldConnect,
    onMessage: (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.action === "guess_result") {
        onGuessResult(msg.is_correct);
      }
    },
    onOpen: () => {
      setStatus("open");
    },
    onClose: () => {
      setStatus("closed");
      if (autoReconnect) {
        reconnectTimer.current = setTimeout(() => {
          setStatus("connecting");
        }, 3000);
      }
    },
    onError: () => {
      setStatus("error");
    },
    onReconnect: (attempt) => {
      console.log(`🔁 尝试第 ${attempt} 次重连`);
    },
  });

  useEffect(() => {
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, []);

  const sendMessage = useCallback(
    (recipient: SenderRole, body: string) => {
      if (readyState !== ReadyState.OPEN) {
        console.warn("⛔ WebSocket 未连接，消息被丢弃");
        return;
      }
      const packet: ChatMessage = {
        action: "message",
        sender: role,
        recipient,
        body,
        ts: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, packet]);
      sendJson(packet);
    },
    [sendJson, role, readyState]
  );

  const sendGuess = useCallback(
    (aiId: string, huId: string) => {
      if (!interrogatorId) {
        console.warn("🚨 无法发送猜测：未获取 interrogatorId");
        return;
      }
      if (readyState !== ReadyState.OPEN) {
        console.warn("⛔ WebSocket 未连接，无法发送猜测");
        return;
      }

      const packet: GuessMessage = {
        action: "guess",
        sender: "I",
        recipient: "server",
        interrogator_id: interrogatorId,
        suspect_ai_id: aiId,
        suspect_human_id: huId,
        ts: new Date().toISOString(),
      };
      sendJson(packet);
    },
    [sendJson, interrogatorId]
  );

  const resetMessages = () => setMessages([]);

  return {
    messages,
    status,
    readyState,
    isConnected,
    sendMessage,
    sendGuess,
    resetMessages,
  };
}
