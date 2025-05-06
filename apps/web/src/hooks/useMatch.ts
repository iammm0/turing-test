import { useCallback, useState } from "react";
import { useWebSocket, ReadyState } from "@/lib/socket";
import { SenderRole } from "@/lib/types";

// ❗ 这个 Hook 不再暴露回调，而是通过状态 matchedGameId 告知外部匹配成功
export function useMatch(shouldConnect: boolean = true) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // ✅ 只有 token 存在时，才构造 WebSocket URL，否则保持为空字符串
  const url = shouldConnect && token
    ? `ws://localhost:8000/api/ws/match?token=${token}`
    : "";

  // 各种状态管理
  const [matchId, setMatchId] = useState<string | null>(null);
  const [role, setRole] = useState<SenderRole | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "found">("idle");
  const [windowT, setWindowT] = useState<number>(0);
  const [matchedGameId, setMatchedGameId] = useState<string | null>(null); // ✅ 新增用于触发跳转

  const { sendJson, readyState } = useWebSocket(
    url,
    evt => {
      switch (evt.action) {
        case "match_found":
          // 成功匹配时设置角色、match_id、确认倒计时
          setMatchId(evt.match_id);
          setRole(evt.role);
          setWindowT(evt.window);
          setStatus("found");
          break;
        case "matched":
          // ❗ 不在此处跳转，仅设置状态
          setMatchedGameId(evt.game_id);
          break;
        case "timeout":
        case "error":
          setStatus("idle");
          break;
      }
    },
    () => {
      setStatus("waiting");
      sendJson({ action: "join" });
    },
    () => {
      setStatus("idle");
    },
    shouldConnect
  );

  // 各种命令行为封装
  const joinQueue = useCallback(() => {
    if (readyState === ReadyState.OPEN) {
      sendJson({ action: "join" });
    }
  }, [sendJson, readyState]);

  const leaveQueue = useCallback(() => {
    if (readyState === ReadyState.OPEN) {
      sendJson({ action: "leave" });
    }
  }, [sendJson, readyState]);

  const acceptMatch = useCallback(() => {
    if (readyState === ReadyState.OPEN && matchId) {
      sendJson({ action: "accept", match_id: matchId });
    }
  }, [sendJson, matchId, readyState]);

  const declineMatch = useCallback(() => {
    if (readyState === ReadyState.OPEN && matchId) {
      sendJson({ action: "decline", match_id: matchId });
    }
  }, [sendJson, matchId, readyState]);

  return {
    status,
    readyState,
    matchId,
    role,
    windowT,
    matchedGameId, // ✅ 关键值：页面中监听这个来跳转
    joinQueue,
    leaveQueue,
    acceptMatch,
    declineMatch,
  };
}
