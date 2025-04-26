"use client";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import { useRef, useEffect, useState } from "react";
import { Msg, Recipient } from "@/types";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { useSendMessage } from "@/hooks/useGame";

interface ChatWindowProps {
  gameId: string;
  label: string;
  messages: Msg[];
  selfSender: Msg["sender"]; // "I" | "H" | "A"
  targetRecipient: Recipient;
  height?: string;
}

export const ChatWindow = ({
  gameId,
  label,
  messages,
  selfSender,
  targetRecipient,
  height = "65vh",
}: ChatWindowProps) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const sendMessage = useSendMessage(gameId);

  const handleSend = () => {
    const body = input.trim();
    if (!body) return;

    const msg: Msg = {
      sender: selfSender,
      recipient: targetRecipient,
      body,
      ts: new Date().toISOString(),
    };

    sendMessage.mutate(msg);
    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height,
        overflow: "hidden",
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        与 {label}
      </Typography>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          bgcolor: "grey.50",
          p: 1.5,
          borderRadius: 1,
        }}
      >
        {messages.map((m) => (
          <MessageBubble key={m.ts} {...m} self={m.sender === selfSender} />
        ))}
        <div ref={bottomRef} />
      </Box>

      <Stack direction="row" spacing={1} mt={2} component="form" onSubmit={(e) => {
        e.preventDefault();
        handleSend();
      }}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          placeholder="输入消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button variant="contained" type="submit">
          发送
        </Button>
      </Stack>
    </Paper>
  );
};
