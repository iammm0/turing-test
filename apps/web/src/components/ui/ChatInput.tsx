"use client";

import { Box, TextField, Button } from "@mui/material";
import { SenderRole } from "@/lib/types";
import styles from "@/styles/ChatInput.module.css";

type ChatInputProps = {
  role: SenderRole;
  input: string;
  setInputAction: (value: string) => void;
  canGuess?: boolean;
  onSendAction: () => void;
};

export default function ChatInput({
  role,
  input,
  setInputAction,
  canGuess = false,
  onSendAction,
}: ChatInputProps) {
  if (canGuess && role === "I") return null;

  return (
    <Box className={styles.inputContainer}>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        placeholder="输入消息…"
        value={input}
        onChange={(e) => setInputAction(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSendAction()}
      />
      <Button
        variant="contained"
        sx={{ ml: 1 }}
        onClick={onSendAction}
        disabled={!input.trim()}
      >
        发送
      </Button>
    </Box>
  );
}
