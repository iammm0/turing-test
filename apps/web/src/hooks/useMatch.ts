import { useCallback, useState } from "react";
import { useWebSocket, ReadyState } from "@/lib/socket";
import {
  AcceptMessage, DeclineMessage,
  JoinMessage,
  LeaveMessage,
  MatchCommandMessage,
  MatchEventMessage,
  SenderRole
} from "@/lib/types";


/**
 * 用于匹配阶段的 Hook
 * 负责发送 join/leave/accept/decline 指令，并响应匹配事件
 */
export function useMatch(shouldConnect: boolean = true) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // 只有在允许连接且有 token 时才构建 WebSocket 地址
  const url = shouldConnect && token
    ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8000/api/ws/match?token=${token}`
    : "";

  const [matchId, setMatchId] = useState<string | null>(null);
  const [role, setRole] = useState<SenderRole | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "found">("idle");
  const [windowT, setWindowT] = useState<number>(0);
  const [matchedGameId, setMatchedGameId] = useState<string | null>(null);

  const { sendJson, readyState } = useWebSocket<
      MatchCommandMessage,
      MatchEventMessage
  >(
    url,
      event => {
      switch (event.action) {
        case "match_found":
          setMatchId(event.match_id);
          setRole(event.role);
          setWindowT(event.window);
          setStatus("found");
          break;
        case "matched":
          setMatchedGameId(event.game_id); // ✅ 外部 useEffect 监听
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
      const msg: JoinMessage = {
        action: "join" ,
        ts: new Date().toISOString(),
      };
      sendJson(msg);
    },
    () => {
      setStatus("idle");
    },
    shouldConnect
  );

  const joinQueue = useCallback(() => {
    if (readyState === ReadyState.OPEN) {
      const msg: JoinMessage = {
        action: "join" ,
        ts: new Date().toISOString(),
      };
      sendJson(msg);
    }
  }, [readyState, sendJson]);


  const leaveQueue = useCallback(() => {
    if (readyState === ReadyState.OPEN) {
      const msg: LeaveMessage = {
        action: "leave" ,
        ts: new Date().toISOString(),
      };
      sendJson(msg);
    }
  }, [sendJson, readyState]);

  const acceptMatch = useCallback(() => {
    if (readyState === ReadyState.OPEN && matchId) {
      const msg: AcceptMessage = {
        action: "accept",
        match_id: matchId ,
        ts: new Date().toISOString(),
      };
      sendJson(msg);
    }
  }, [sendJson, readyState, matchId]);

  const declineMatch = useCallback(() => {
    if (readyState === ReadyState.OPEN && matchId) {
      const msg: DeclineMessage = {
        action: "decline",
        match_id: matchId ,
        ts: new Date().toISOString(),
      };
      sendJson(msg);
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
