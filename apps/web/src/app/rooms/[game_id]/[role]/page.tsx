"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { ChatMessage, SenderRole } from "@/lib/types";
import { useGame } from "@/hooks/useGame";
import InterrogatorUI from "@/components/ui/InterrogatorUI";
import WitnessUI from "@/components/ui/WitnessUI";

export default function RoomPage() {
  const pathname = usePathname();
  const router = useRouter();

  // ✅ 从 pathname 中提取参数
  const [gameId, role] = useMemo(() => {
    const segments = pathname.split("/");
    const gameId = segments[2];
    const rawRole = segments[3]?.split("?")[0]; // 🧼 防止 token 干扰
    return [gameId, rawRole as SenderRole];
  }, [pathname]);

  const isValidRole = role === "I" || role === "A" || role === "H";
  if (!isValidRole) return <div>❌ 非法角色</div>;

  // ✅ 回调：猜测结果后跳转
  const onGuessResult = () => router.push("/");

  // ✅ 获取游戏状态
  const {
    messages,
    status,
    sendMessage,
    sendGuess,
  } = useGame(gameId, role, onGuessResult);

  // ✅ 类型收窄
  const chatMessages = useMemo(
    () =>
      messages.filter(
        (m): m is ChatMessage => m.action === "message"
      ),
    [messages]
  );

  // ✅ 拆分为与 A / H 的对话
  const messagesA = chatMessages.filter(
    (m) =>
      (m.sender === "A" && m.recipient === "I") ||
      (m.sender === "I" && m.recipient === "A")
  );
  const messagesH = chatMessages.filter(
    (m) =>
      (m.sender === "H" && m.recipient === "I") ||
      (m.sender === "I" && m.recipient === "H")
  );

  return role === "I" ? (
    <InterrogatorUI
      messages={messages}
      messagesA={messagesA}
      messagesH={messagesH}
      status={status}
      sendMessageAction={(recipient, body) => {
        if (recipient === "A" || recipient === "H") {
          sendMessage(recipient as SenderRole, body);
        }}}
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
