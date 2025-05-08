import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWebSocket, ReadyState } from "@/lib/socket";
import {
  ChatMessage,
  GuessMessage,
  GuessResultMessage,
  MessagePacket,
  SenderRole,
} from "@/lib/types";
import { jwtDecode } from "jwt-decode";

type Status = "connecting" | "open" | "closed" | "error";

export function useGame(
  gameId: string,
  role: SenderRole,
  onGuessResult: (correct: boolean) => void,
  autoReconnect: boolean = true
) {
  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("access_token") : ""),
    []
  );
  const url = `ws://localhost:8000/api/ws/rooms/${gameId}/${role}?token=${token}`;

  const interrogatorId = useMemo(() => {
    try {
      return token ? jwtDecode<{ sub: string }>(token).sub : null;
    } catch {
      return null;
    }
  }, [token]);

  const [messages, setMessages] = useState<MessagePacket[]>([]);
  const [status, setStatus] = useState<Status>("connecting");

  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { sendJson, readyState } = useWebSocket<MessagePacket, MessagePacket>(
    url,
    (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.action === "guess_result") {
        const result = msg as GuessResultMessage;
        onGuessResult(result.is_correct);
      }
    },
    () => setStatus("open"),
    () => {
      setStatus("closed");
      if (autoReconnect) {
        reconnectTimer.current = setTimeout(() => {
          setStatus("connecting");
        }, 3000);
      }
    },
    true
  );

  useEffect(() => {
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, []);

  const sendMessage = useCallback(
    (recipient: SenderRole, body: string) => {
      const packet: ChatMessage = {
        action: "message",
        sender: role,
        recipient,
        body,
        ts: new Date().toISOString(),
      };
      sendJson(packet);
    },
    [sendJson, role]
  );

  const sendGuess = useCallback(
    (aiId: string, huId: string) => {
      if (!interrogatorId) {
        console.warn("🚨 无法发送猜测：未获取 interrogatorId");
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

  return {
    messages,
    status,
    readyState,
    sendMessage,
    sendGuess,
  };
}
