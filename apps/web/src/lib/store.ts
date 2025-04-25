import { create } from "zustand";
import { Sender } from "@/types";

export type Msg = {
  sender: Sender;
  recipient: Sender;
  body: string;
  ts: string;
};

export const useRoomStore = create<{
  messages: Msg[];
  addMessage: (m: Msg) => void;
}>((set) => ({
  messages: [],
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
}));