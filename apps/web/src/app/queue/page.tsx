"use client";

import { useEffect } from "react";
import { ReadyState }     from "@/lib/socket";
import { useRouter }      from "next/navigation";
import { useMatch }       from "@/hooks/useMatch";

export default function QueuePage() {
  const router = useRouter();

  // 调用 useMatch，当 matched 回调里拿到 gameId 时跳转
  const {
    status,
    readyState,
    matchId,
    role,
    windowT,
    joinQueue,
    leaveQueue,
    acceptMatch,
    declineMatch,
  } = useMatch(gameId => {
    // 对方都 accept -> 收到 matched -> 跳转到房间页
    router.push(`/rooms/${gameId}/${role}`);
  });

  // —— 关键：等 WebSocket READY_STATE === OPEN 时才发 join ——
  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      joinQueue();
    }
    return () => {
      // 页面卸载或切换时自动 leave
      if (readyState === ReadyState.OPEN) {
        leaveQueue();
      }
    };
  }, [readyState, joinQueue, leaveQueue]);

  return (
    <div>
      <h2>当前匹配状态：{status}</h2>
      {status === "found" && (
        <>
          <p>Match ID: {matchId}</p>
          <p>你的角色: {role}</p>
          <p>剩余确认时间: {windowT} 秒</p>
          <button onClick={acceptMatch}>接受</button>
          <button onClick={declineMatch}>拒绝</button>
        </>
      )}
      {(status === "waiting" || status === "idle") && (
        <p>{status === "waiting" ? "正在排队，请耐心等待…" : "请点击开始匹配"}</p>
      )}
    </div>
  );
}
