"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";

import { useGame } from "@/hooks/useGame";
import { decodeJwt } from "@/lib/auth";
import { GuessMessage, SenderRole } from "@/lib/types";

export default function RoomPage() {
  const router = useRouter();
  const params = usePathname().split("/");
  const gameId = params[2];
  const role = params[3] as SenderRole;

  const [input, setInput] = useState("");
  const [guessAiId, setGuessAiId] = useState("");
  const [guessHuId, setGuessHuId] = useState("");
  const [canGuess, setCanGuess] = useState(false);

  const onGuessResult = () => {
    router.push("/");
  };

  const {
    messages,
    status,
    sendMessage,
    sendGuess,
  } = useGame(gameId, role, onGuessResult);

  // 💬 检查是否已结束聊天（出现 chat_ended 消息）
  useEffect(() => {
    if (messages.some((m) => m.action === "chat_ended")) {
      setCanGuess(true);
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const recipient: SenderRole = role === "I" ? SenderRole.H : SenderRole.I;
    sendMessage(recipient, input.trim());
    setInput("");
  };

  const handleGuess = () => {
    const token = localStorage.getItem("access_token");
    const decoded = token ? decodeJwt(token) : null;
    const userId = decoded?.sub;

    if (!userId) {
      console.warn("⚠️ Token 无效或不存在");
      return;
    }

    const guessPacket: GuessMessage = {
      action: "guess",
      sender: "I",
      recipient: "server",
      suspect_ai_id: guessAiId,
      suspect_human_id: guessHuId,
      interrogator_id: userId,
      ts: new Date().toISOString(),
    };

    sendGuess(guessPacket.suspect_ai_id, guessPacket.suspect_human_id);
  };

  return (
    <Box px={2} py={1}>
      <Typography variant="h6">
        房间号: {gameId} — 您是 {role}
      </Typography>
      <Typography>Status: {status}</Typography>

      <List sx={{ height: "60vh", overflowY: "auto", mb: 2 }}>
        {messages.map((m, i) =>
          "body" in m ? (
            <ListItem key={i}>
              <ListItemText
                primary={`${m.sender} → ${m.recipient}: ${m.body}`}
                secondary={new Date(m.ts).toLocaleTimeString()}
              />
            </ListItem>
          ) : null
        )}
      </List>

      {status === "connecting" && <CircularProgress />}

      {!canGuess && status === "open" && (
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            placeholder="输入消息…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button variant="contained" onClick={handleSend}>
            发送
          </Button>
        </Box>
      )}

      {role === "I" && canGuess && (
        <Box mt={2} display="flex" flexDirection="column" gap={1}>
          <Typography>聊天结束，请猜测 AI / 人类：</Typography>
          <TextField
            label="猜测 AI 的用户 ID"
            value={guessAiId}
            onChange={(e) => setGuessAiId(e.target.value)}
          />
          <TextField
            label="猜测 Human 的用户 ID"
            value={guessHuId}
            onChange={(e) => setGuessHuId(e.target.value)}
          />
          <Button variant="contained" color="warning" onClick={handleGuess}>
            提交猜测
          </Button>
        </Box>
      )}
    </Box>
  );
}
