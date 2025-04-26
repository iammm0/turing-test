"use client";

import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import {useChat} from "@/ChatContext";

export function ChatWitnessBox() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({
      sender: "H",
      recipient: "I",
      body: input,
    });
    setInput("");
  };

  return (
    <Box>
      <Typography variant="subtitle1" color="text.secondary">
        {status === "open" ? "连接成功" : "连接中..."}
      </Typography>

      <Box
        height={400}
        overflow="auto"
        p={2}
        mb={2}
        sx={{ border: "1px solid #ccc", borderRadius: 2 }}
      >
        {messages.map((msg, i) => (
          <Box key={i} textAlign={msg.sender === "H" ? "right" : "left"}>
            <Paper
              sx={{
                display: "inline-block",
                px: 2,
                py: 1,
                mb: 1,
                bgcolor: msg.sender === "H" ? "primary.main" : "grey.200",
                color: msg.sender === "H" ? "primary.contrastText" : "black",
              }}
            >
              {msg.body}
            </Paper>
          </Box>
        ))}
      </Box>

      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          placeholder="请输入..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button variant="contained" onClick={handleSend} disabled={!input.trim()}>
          发送
        </Button>
      </Box>
    </Box>
  );
}
