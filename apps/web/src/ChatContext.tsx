"use client";

import {
  createContext,
  useContext,
  useMemo,
} from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import { Msg, Sender } from "@/types";

type ChatContextType = {
  messages: Msg[];
  sendMessage: (msg: { sender: string; recipient: string; body: string }) => void;
  status: "connecting" | "open" | "closed" | "error";
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({
  gameId,
  role,
  children,
}: {
  gameId: string;
  role: Sender;
  children: React.ReactNode;
}) {
  const { messages, sendMessage, status } = useChatSocket(gameId, role);

  const value = useMemo(
    () => ({ messages, sendMessage, status }),
    [messages, sendMessage, status]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within <ChatProvider>");
  }
  return ctx;
}
