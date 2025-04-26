"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatDualPane from "@/components/chat/ChatDualPane";
import { ChatWitnessBox } from "@/components/chat/ChatWitnessBox";
import {ChatLayout} from "@/components/layout/ChatLayout";
import {ChatProvider} from "@/ChatContext";

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [role, setRole] = useState<"J" | "W">(); // Judge or Witness

  // 模拟角色分配
  useEffect(() => {
    const assigned = localStorage.getItem(`role-${id}`);
    if (assigned === "J" || assigned === "W") {
      setRole(assigned);
    } else {
      const r = Math.random() > 0.5 ? "J" : "W";
      setRole(r);
      localStorage.setItem(`role-${id}`, r);
    }
  }, [id]);

  const handleTimeout = () => {
    if (role === "J") {
      router.push(`/rooms/${id}/decision`);
    } else {
      router.push(`/rooms/${id}/result?timeout=true`);
    }
  };

  if (!role) return null;

  return (
      <ChatProvider gameId={id} role={role === "J" ? "I" : "H"}>
        <ChatLayout
            title={role === "J" ? "你是裁判，请向两个证人提问" : "你是证人，请等待裁判提问"}
            showDecisionButton={role === "J"}
            onDecision={handleTimeout}
        >
          {role === "J" ? (
              <ChatDualPane />
          ) : (
              <ChatWitnessBox />
          )}
        </ChatLayout>
      </ChatProvider>
  );
}
