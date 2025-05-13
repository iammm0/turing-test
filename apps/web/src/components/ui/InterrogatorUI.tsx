"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
// ✅ 正确
import {ChatMessage, MessagePacket} from "@/lib/types";
import ChatBubble from "./ChatBubble";
import styles from "@/styles/InterrogatorUI.module.css";

// ✅ 改动：不再使用 SenderRole enum
type Props = {
  messages: MessagePacket[];
  messagesA: ChatMessage[];
  messagesH: ChatMessage[];
  status: string;
  sendMessageAction: (recipient: "A" | "H", body: string) => void;
  sendGuessAction: (aiId: string, huId: string) => void;
};

export default function InterrogatorUI({
  messages,
  messagesA,
  messagesH,
  status,
  sendMessageAction,
  sendGuessAction,
}: Props) {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<"A" | "H">("A"); // ✅ 改
  const [guessAiId, setGuessAiId] = useState("");
  const [guessHuId, setGuessHuId] = useState("");
  const [canGuess, setCanGuess] = useState(false);

  useEffect(() => {
    if (messages.some((m) => m.action === "chat_ended")) {
      setCanGuess(true);
    }
  }, [messagesA, messagesH]);



  const handleSend = () => {
    if (!input.trim()) return;
    sendMessageAction(target, input.trim());
    setInput("");
  };

  const handleGuess = () => {
    const token = localStorage.getItem("access_token");
    const decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;
    if (!decoded?.sub) return;
    sendGuessAction(guessAiId, guessHuId);
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h6" fontWeight="bold">🕵️‍♂️ 您是审讯者</Typography>
        <Typography variant="body2" color={status === "open" ? "green" : "gray"}>
          {status}
        </Typography>
      </Box>

      <Box display="flex" gap={2}>
        {/* 左侧聊天框 */}
        <Box flex={1}>
          <Typography fontWeight="bold" mb={1}>
          💬 与证人 A
          </Typography>
          <Paper elevation={2} className={styles.chatBox}>
            {messagesA.map((m, i) =>
                m.action === "message" ? (
                    <ChatBubble
                        key={i}
                        sender={m.sender}
                        recipient={m.recipient}
                        body={m.body}
                        ts={m.ts}
                        isOwn={m.sender === "I"}
                    />
                ) : null
            )}
          </Paper>
        </Box>

        {/* 右侧聊天框 */}
        <Box flex={1}>
          <Typography fontWeight="bold" mb={1}>
          💬 与证人 B
          </Typography>
          <Paper elevation={2} className={styles.chatBox}>
            {messagesH.map((m, i) =>
                m.action === "message" ? (
                    <ChatBubble
                        key={i}
                        sender={m.sender}
                        recipient={m.recipient}
                        body={m.body}
                        ts={m.ts}
                        isOwn={m.sender === "I"}
                    />
                ) : null
            )}
          </Paper>
        </Box>

      </Box>
      {!canGuess && (
        <Box className={styles.inputArea}>
          <TextField
            variant="outlined"
            fullWidth
            size="small"
            value={input}
            placeholder={`发送给 ${target === "A" ? "证人 A" : "证人 B"}`}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <ToggleButtonGroup
            exclusive
            value={target}
            onChange={(_, val) => val && setTarget(val)} // ✅ 不需要 as SenderRole
            sx={{ mx: 1 }}
          >
            <ToggleButton value="A">证人 A</ToggleButton>
            <ToggleButton value="H">证人 B</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" onClick={handleSend}>发送</Button>
        </Box>
      )}

      {canGuess && (
        <Box className={styles.guessArea}>
          <Typography fontWeight="bold" mb={1}>🔍 猜测谁是 AI / Human</Typography>
          <TextField
            fullWidth size="small" label="AI 用户 ID" sx={{ mt: 1 }}
            value={guessAiId}
            onChange={(e) => setGuessAiId(e.target.value)}
          />
          <TextField
            fullWidth size="small" label="Human 用户 ID" sx={{ mt: 1 }}
            value={guessHuId}
            onChange={(e) => setGuessHuId(e.target.value)}
          />
          <Button variant="contained" color="warning" fullWidth sx={{ mt: 2 }} onClick={handleGuess}>
            提交猜测
          </Button>
        </Box>
      )}
    </Box>
  );
}
