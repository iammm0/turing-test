"use client";
import { useEffect, useRef, useState } from "react";
import {router} from "next/client";

export default function WsMatch() {
  const ws = useRef<WebSocket|null>(null);
  const [phase, setPhase] = useState<"queue"|"confirm">("queue");
  const [role, setRole] = useState<"I"|"W">("I");
  const [mid, setMid] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const base = process.env.NEXT_PUBLIC_WS_BASE;
    if (!token || !base) return;

    ws.current = new WebSocket(`${base}/ws/match?token=${token}`);

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ action: "join" }));
    };

    ws.current.onmessage = evt => {
      const msg = JSON.parse(evt.data);
      switch(msg.action) {
        case "match_found":
          setPhase("confirm");
          setMid(msg.match_id);
          setRole(msg.role);
          setTimer(msg.window);
          break;
        case "requeue":
          setPhase("queue");
          ws.current?.send(JSON.stringify({ action: "join" }));
          break;
        case "matched":
          // 进入房间
          window.location.href = `/rooms/${msg.game_id}`;
          break;
      }
    };

    return () => {
      ws.current?.send(JSON.stringify({ action: "leave" }));
      ws.current?.close();
    };
  }, [router]);

  // 倒计时
  useEffect(() => {
    if (phase !== "confirm" || timer <= 0) return;
    const id = setInterval(() => setTimer(t=>t-1), 1000);
    if (timer===0) {
      ws.current?.send(JSON.stringify({ action: "leave" }));
      setPhase("queue");
    }
    return () => clearInterval(id);
  }, [phase, timer]);

  return (
    <div>
      {phase === "queue" && <p>排队中…</p>}
      {phase === "confirm" && (
        <div>
          <p>匹配成功！您是：{role==="I"?"审讯者":"证人"}</p>
          <p>倒计时：{timer}s</p>
          <button onClick={()=>ws.current?.send(JSON.stringify({action:"accept",match_id:mid}))}>
            接受
          </button>
          <button onClick={()=>ws.current?.send(JSON.stringify({action:"decline",match_id:mid}))}>
            拒绝
          </button>
        </div>
      )}
    </div>
  );
}
