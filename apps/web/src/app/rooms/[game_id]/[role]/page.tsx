"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { SenderRole } from "@/lib/types";
import { useGame } from "@/hooks/useGame";
import InterrogatorUI from "@/components/ui/InterrogatorUI";
import WitnessUI from "@/components/ui/WitnessUI";

export default function RoomPage() {
  const pathname = usePathname();
  const router = useRouter();

  // ✅ 从 pathname 中提取并清洗角色参数
  const [gameId, role] = useMemo(() => {
    const segments = pathname.split("/");
    const gameId = segments[2];
    const rawRole = segments[3]?.split("?")[0]; // 🧼 清洗掉 ?token=
    return [gameId, rawRole as SenderRole];
  }, [pathname]);

  const isValidRole = role === "I" || role === "A" || role === "H";
  if (!isValidRole) return <div>❌ 非法角色</div>;

  const onGuessResult = () => router.push("/");

  const {
    messages,
    status,
    sendMessage,
    sendGuess,
  } = useGame(gameId, role, onGuessResult);

  return role === "I" ? (
    <InterrogatorUI
        role={role}
        messages={messages}
        status={status}
        sendMessageAction={sendMessage}
        sendGuessAction={sendGuess}
    />

  ) : (
    <WitnessUI
        role={role}
        messages={messages}
        status={status}
        sendMessageAction={sendMessage}
    />

  );
}
