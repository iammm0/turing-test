import { useEffect, useCallback, useState } from "react";
import { useWebSocket }                            from "@/lib/socket";
import { SenderRole }                              from "@/lib/types";
import {jwtDecode} from "jwt-decode";

export function useGame(
  gameId: string,
  role: SenderRole,
  onGuessResult: (correct: boolean) => void
) {
  const token = localStorage.getItem("access_token");
  const base  = process.env.NEXT_PUBLIC_WS_BASE;
  const url   = `${base}/ws/rooms/${gameId}/${role}?token=${token}`;

  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  const { sendJson, readyState } = useWebSocket(
    url,
    (evt:any) => {
      // 所有发布到 Redis 的消息都以 text 形式进这里
      const msg = JSON.parse(evt);
      setMessages(m => [...m, msg]);
    },
    () => { setConnected(true); },
    () => { setConnected(false); }
  );

  const sendMessage = useCallback((recipient: SenderRole, body: string) => {
    sendJson({ action:"message", sender:role, recipient, body });
  }, [sendJson, role]);

  // Decode once when hook 初始化
  const rawToken = typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null;
  // 定义一个类型来让 TS 识别 sub：
  interface JwtPayload { sub: string; [key: string]: any }
  const payload: JwtPayload | null = rawToken
    ? jwtDecode<JwtPayload>(rawToken)
    : null;
  const interrogatorId = payload?.sub;

  const sendGuess = useCallback((aiId: string, huId: string) => {
    sendJson({
      action: "guess",
      interrogator_id: interrogatorId,
      suspect_ai_id: aiId,
      suspect_human_id: huId,
    });
  }, [sendJson]);

  // 监听猜测结果
  useEffect(() => {
    const last = messages[messages.length-1];
    if (last?.action === "guess_result") {
      onGuessResult(last.is_correct);
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
