import { useCallback, useEffect, useMemo, useState } from "react";
import { useWebSocket } from "@/lib/socket";
import {
  MessagePacket,
  SenderRole,
  ChatMessage,
  GuessMessage,
  GuessResultMessage
} from "@/lib/types";
import { jwtDecode } from "jwt-decode";

export function useGame(
  gameId: string,
  role: SenderRole,
  onGuessResult: (correct: boolean) => void
) {
  const token = useMemo(() => {
    return typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  }, []);
  const base = process.env.NEXT_PUBLIC_WS_BASE;
  const url = `${base}/ws/rooms/${gameId}/${role}?token=${token}`;

  const interrogatorId = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode<{ sub: string }>(token);
      return decoded.sub;
    } catch {
      return null;
    }
  }, [token]);

  const [messages, setMessages] = useState<MessagePacket[]>([]);
  const [connected, setConnected] = useState(false);

  const { sendJson, readyState } = useWebSocket<MessagePacket, MessagePacket>(
    url,
    (msg) => setMessages((prev) => [...prev, msg]),
    () => setConnected(true),
    () => setConnected(false)
  );

  const sendMessage = useCallback((recipient: SenderRole, body: string) => {
    const packet: ChatMessage = {
      action: "message",
      sender: role,
      recipient,
      body,
      ts: new Date().toISOString(),
    };
    sendJson(packet);
  }, [sendJson, role]);

  const sendGuess = useCallback((aiId: string, huId: string) => {
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
  }, [sendJson, interrogatorId]);

  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (latest?.action === "guess_result") {
      const result = latest as GuessResultMessage;
      onGuessResult(result.is_correct);
    }
  }, [messages, onGuessResult]);

  return {
    messages,
    connected,
    readyState,
    sendMessage,
    sendGuess,
  };
}
