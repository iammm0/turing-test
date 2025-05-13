"use client";

import { useState } from "react";
import { SenderRole, MessagePacket } from "@/lib/types";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";
import ChatBubble from "./ChatBubble";
import styles from "@/styles/WitnessUI.module.css";

type Props = {
  role: SenderRole;
  messages: MessagePacket[];
  status: string;
  sendMessageAction: (recipient: SenderRole, body: string) => void;
};

export default function WitnessUI({ role, messages, status, sendMessageAction }: Props) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessageAction(SenderRole.I, input.trim());
    setInput("");
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h6" fontWeight="bold">
          {role === "H" ? "🧍‍♂️ 您是人类证人" : "🤖 您是 AI"}
        </Typography>
        <Typography variant="body2" color={status === "open" ? "green" : "gray"}>
          {status}
        </Typography>
      </Box>

      <Paper elevation={2} className={styles.chatBox}>
        {messages.map((m, i) =>
          m.action === "message" ? (
            <ChatBubble
              key={i}
              sender={m.sender as SenderRole}
              recipient={m.recipient as SenderRole}
              body={m.body}
              ts={m.ts}
              isOwn={m.sender === role}
            />
          ) : null
        )}
      </Paper>

      <Box className={styles.inputArea}>
        <TextField
          variant="outlined"
          fullWidth
          size="small"
          placeholder="输入消息…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button variant="contained" sx={{ ml: 1 }} onClick={handleSend}>
          发送
        </Button>
      </Box>
    </Box>
  );
}
