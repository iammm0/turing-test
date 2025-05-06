import { useCallback, useState } from "react";
import { useWebSocket, ReadyState } from "@/lib/socket";
import { SenderRole } from "@/lib/types";

/**
 * 匹配逻辑 Hook：处理匹配队列、确认流程、最终跳转准备
 */
export function useMatch(shouldConnect: boolean = true) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const url = shouldConnect && token
    ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8000/api/ws/match?token=${token}`
    : "";

  const [matchId, setMatchId] = useState<string | null>(null);
  const [role, setRole] = useState<SenderRole | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "found">("idle");
  const [windowT, setWindowT] = useState<number>(0);
  const [matchedGameId, setMatchedGameId] = useState<string | null>(null);

  const { sendJson, readyState } = useWebSocket(
    url,
    evt => {
      switch (evt.action) {
        case "match_found":
          setMatchId(evt.match_id);
          setRole(evt.role);
          setWindowT(evt.window);
          setStatus("found");
          break;
        case "matched":
          setMatchedGameId(evt.game_id); // ✅ 外部 useEffect 监听
          break;
        case "timeout":
        case "error":
          setStatus("idle");
          break;
      }
    },
    () => {
      setStatus("waiting");
      console.log("🛰️ 尝试发送 join 指令");
      sendJson({ action: "join" });
    },
    () => {
      setStatus("idle");
    },
    shouldConnect
  );

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
  }, [sendJson, readyState, matchId]);

  const declineMatch = useCallback(() => {
    if (readyState === ReadyState.OPEN && matchId) {
      sendJson({ action: "decline", match_id: matchId });
    }
  }, [sendJson, readyState, matchId]);

  return {
    status,
    readyState,
    matchId,
    role,
    windowT,
    matchedGameId, // ✅ 外部用于跳转
    joinQueue,
    leaveQueue,
    acceptMatch,
    declineMatch,
  };
}
