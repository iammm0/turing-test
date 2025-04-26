"use client";

import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { Recipient } from "@/types";
import {useChat} from "@/ChatContext";

const recipients: Recipient[] = ["A", "H"];

export default function ChatDualPane() {
  const { messages, sendMessage, status } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [inputs, setInputs] = useState<Record<Recipient, string>>({
    A: "",
    H: "",
  });

  const handleSend = (recipient: Recipient) => {
    const body = inputs[recipient].trim();
    if (!body) return;

    sendMessage({
      sender: "I",
      recipient,
      body,
    });

    setInputs((prev) => ({ ...prev, [recipient]: "" }));
  };

  return (
    <Box
      display="flex"
      flexDirection={isMobile ? "column" : "row"}
      gap={2}
    >
      {recipients.map((target) => (
        <Box
          key={target}
          flex={1}
          display="flex"
          flexDirection="column"
          component={Paper}
          elevation={3}
          sx={{
            p: 2,
            height: "70vh",
            minWidth: 0,
          }}
        >
          <Typography variant="h6" gutterBottom>
            与 {target === "A" ? "AI" : "Human"} 的对话
          </Typography>

          <Box
            flex={1}
            overflow="auto"
            display="flex"
            flexDirection="column"
            gap={1}
            mb={2}
            sx={{
              border: "1px solid #ddd",
              borderRadius: 1,
              p: 1,
              bgcolor: "#fafafa",
            }}
          >
            {messages
              .filter(
                (m) =>
                  (m.sender === "I" && m.recipient === target) ||
                  m.sender === target
              )
              .map((m, i) => (
                <Box
                  key={i}
                  alignSelf={m.sender === "I" ? "flex-end" : "flex-start"}
                  bgcolor={m.sender === "I" ? "primary.main" : "grey.200"}
                  color={m.sender === "I" ? "primary.contrastText" : "black"}
                  px={2}
                  py={1}
                  borderRadius={2}
                  maxWidth="80%"
                >
                  <Typography variant="body2">{m.body}</Typography>
                </Box>
              ))}
          </Box>

          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              placeholder={`向 ${target === "A" ? "AI" : "Human"} 提问...`}
              value={inputs[target]}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, [target]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend(target);
                }
              }}
            />
            <Button
              variant="contained"
              onClick={() => handleSend(target)}
              disabled={status !== "open"}
            >
              发送
            </Button>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
