"use client";

import {useRouter, useParams} from "next/navigation";
import { useChatSocket } from "@/hooks/useChatSocket";
import { Sender } from "@/types";
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
import { useState, useEffect } from "react";
import { decodeJwt } from "@/lib/auth";
import {GuessMessage, GuessResultMessage} from "@/lib/types";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ game_id: string; role: string }>();
  const gameId = params.game_id;
  const role = params.role as Sender;

  const { messages, sendMessage, status } = useChatSocket(gameId, role);

  const [input, setInput] = useState("");
  const [guessAiId, setGuessAiId] = useState("");
  const [guessHuId, setGuessHuId] = useState("");
  const [canGuess, setCanGuess] = useState(false);

  // 💬 监听聊天结束（chat_ended）
  useEffect(() => {
    if (messages.some((m) => m.action === "chat_ended")) {
      setCanGuess(true);
    }
  }, [messages]);

  // ✅ 监听猜测结果（guess_result）
  useEffect(() => {
    const result = messages.find((m): m is GuessResultMessage => m.action === "guess_result");
    if (result) {
      // 可加 Toast 提示：result.is_correct
      router.push("/");
    }
  }, [messages, router]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({
      action: "message",
      sender: role,
      recipient: role === "I" ? "H" : "I",
      body: input.trim(),
    });
    setInput("");
  };

  const handleGuess = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.warn("⚠️ Token 不存在");
      return;
    }
    const decoded = decodeJwt(token);
    const userId = decoded?.sub;
    if (!userId) {
      console.warn("⚠️ 无效 Token");
      return;
    }

    const guessPacket: GuessMessage = {
      action: "guess",
      sender: "I",
      recipient: "server",
      suspect_ai_id: guessAiId,
      suspect_human_id: guessHuId,
      interrogator_id: userId,
      ts: new Date().toISOString(), // ✅ 添加时间戳
    };

    sendMessage(guessPacket);
  };

  return (
    <Box px={2} py={1}>
      <Typography variant="h6">房间号: {gameId} — 您是 {role}</Typography>
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
          <Typography>聊天结束，请选择 AI / 人类：</Typography>
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
