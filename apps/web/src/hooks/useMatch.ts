import { useCallback, useEffect, useState } from "react";
import {
  AcceptMessage,
  DeclineMessage,
  JoinMessage,
  LeaveMessage,
  MatchCommandMessage,
  MatchEventMessage,
  SenderRole,
} from "@/lib/types";
import {ReadyState, useWebSocket} from "@/lib/socket";

/**
 * 用于匹配阶段的 Hook。
 * 负责管理 join/leave/accept/decline 指令，并监听匹配事件。
 */
export function useMatch(shouldConnect: boolean = true) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const url =
    shouldConnect && token
      ? `${location.protocol === "https:" ? "wss" : "ws"}://localhost:8000/api/ws/match?token=${token}`
      : "";

  const [matchId, setMatchId] = useState<string | null>(null);
  const [role, setRole] = useState<SenderRole | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "found" | "connected">("idle");
  const [windowT, setWindowT] = useState<number>(0);
  const [matchedGameId, setMatchedGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { sendJson, readyState, isConnected, disconnect } = useWebSocket<
    MatchCommandMessage,
    MatchEventMessage
  >({
    url,
    shouldConnect,
    onMessage: (event) => {
      switch (event.action) {
        case "match_found":
          setMatchId(event.match_id);
          setRole(event.role);
          setWindowT(event.window);
          setStatus("found");
          break;
        case "matched":
          setMatchedGameId(event.game_id);
          break;
        case "timeout":
          setStatus("idle");
          setError("匹配超时");
          break;
        case "error":
          setStatus("idle");
          setError(event.detail || "匹配失败");
          break;
        case "requeue":
          setStatus("waiting");
          break;
      }
    },
    onOpen: () => {
      setStatus("connected");
      sendJson({
        action: "join",
        ts: new Date().toISOString(),
      } satisfies JoinMessage);
    },
    onClose: () => {
      setStatus("idle");
    },
    onError: (err) => {
      console.error("WebSocket 错误:", err);
      setError("连接错误");
    },
    onReconnect: (attempt) => {
      console.log(`🔁 正在尝试第 ${attempt} 次重连...`);
    },
  });

  const joinQueue = useCallback(() => {
    if (readyState === ReadyState.OPEN) {
      sendJson({
        action: "join",
        ts: new Date().toISOString(),
      } satisfies JoinMessage);
    }
  }, [readyState, sendJson]);

  const leaveQueue = useCallback(() => {
    if (readyState === ReadyState.OPEN) {
      sendJson({
        action: "leave",
        ts: new Date().toISOString(),
      } satisfies LeaveMessage);
    }
  }, [readyState, sendJson]);

  const acceptMatch = useCallback(() => {
    if (readyState === ReadyState.OPEN && matchId) {
      sendJson({
        action: "accept",
        match_id: matchId,
        ts: new Date().toISOString(),
      } satisfies AcceptMessage);
    }
  }, [readyState, sendJson, matchId]);

  const declineMatch = useCallback(() => {
    if (readyState === ReadyState.OPEN && matchId) {
      sendJson({
        action: "decline",
        match_id: matchId,
        ts: new Date().toISOString(),
      } satisfies DeclineMessage);
    }
  }, [readyState, sendJson, matchId]);

  const resetMatch = () => {
    setMatchId(null);
    setRole(null);
    setStatus("idle");
    setWindowT(0);
    setMatchedGameId(null);
    setError(null);
  };

  useEffect(() => {
    if (!shouldConnect || !token) {
      setStatus("idle");
    }
  }, [shouldConnect, token]);

  return {
    status,
    readyState,
    isConnected,
    error,
    matchId,
    role,
    windowT,
    matchedGameId,
    joinQueue,
    leaveQueue,
    acceptMatch,
    declineMatch,
    resetMatch,
    disconnect,
  };
}
