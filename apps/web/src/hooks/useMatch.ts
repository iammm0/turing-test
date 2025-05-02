// hooks/useMatch.ts
import { useCallback, useState } from "react";
import { useWebSocket } from "@/lib/socket";
import { SenderRole } from "@/lib/types";

export function useMatch(onMatched: (gameId: string) => void) {
  const token = localStorage.getItem("access_token");
  const url   = `ws://localhost:8000/api/ws/match?token=${token}`;

  const [matchId, setMatchId] = useState<string | null>(null);
  const [role,    setRole   ] = useState<SenderRole | null>(null);
  const [status,  setStatus ] = useState<"idle"|"waiting"|"found">("idle");
  const [windowT, setWindowT] = useState<number>(0);

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
          onMatched(evt.game_id);
          break;
        case "timeout":
        case "error":
          setStatus("idle");
          break;
      }
    },
    () => { setStatus("waiting"); },   // onOpen
    () => { setStatus("idle"); }       // onClose
  );

  const joinQueue = useCallback(() => {
    sendJson({ action: "join" });
  }, [sendJson]);

  const leaveQueue = useCallback(() => {
    sendJson({ action: "leave" });
  }, [sendJson]);

  const acceptMatch = useCallback(() => {
    if (matchId) sendJson({ action: "accept", match_id: matchId });
  }, [sendJson, matchId]);

  const declineMatch = useCallback(() => {
    if (matchId) sendJson({ action: "decline", match_id: matchId });
  }, [sendJson, matchId]);

  return {
    status,
    readyState,
    matchId,
    role,
    windowT,
    joinQueue,
    leaveQueue,
    acceptMatch,
    declineMatch,
  };
}
