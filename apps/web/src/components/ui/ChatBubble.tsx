"use client";

import { Box, Typography, Paper } from "@mui/material";
import styles from "@/styles/ChatBubble.module.css";

// ✅ 改动：使用 string 字面量类型
type Props = {
  sender: "I" | "A" | "H";           // ✅ 改
  recipient: "I" | "A" | "H";        // ✅ 改
  body: string;
  ts: string;
  isOwn: boolean;
};

export default function ChatBubble({ sender, recipient, body, ts, isOwn }: Props) {
  const bg =
    sender === "A"
      ? "#e0e0e0"
      : sender === "H"
      ? "#fff3cd"
      : "#2196f3";

  const color = sender === "I" ? "#fff" : "#000";

  return (
    <Box
      className={`${styles.bubbleWrapper} ${isOwn ? styles.own : styles.other}`}
    >
      <Paper
        className={styles.bubble}
        sx={{ backgroundColor: bg, color }}
      >
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {body}
        </Typography>
        <Typography
          variant="caption"
          align="right"
          display="block"
          sx={{ opacity: 0.5, mt: 0.5 }}
        >
          {new Date(ts).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
}
