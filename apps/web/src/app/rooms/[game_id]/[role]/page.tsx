"use client";

import { useRouter, usePathname } from "next/navigation";
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

export default function RoomPage() {
  const router = useRouter();
  const params = usePathname().split("/");
  // URL 模式 /rooms/{game_id}/{role}
  const gameId = params[2];
  const role = params[3] as Sender;

  const { messages, sendMessage, status } = useChatSocket(gameId, role);

  const [input, setInput] = useState("");
  const [guessAiId, setGuessAiId] = useState("");
  const [guessHuId, setGuessHuId] = useState("");
  const [canGuess, setCanGuess] = useState(false);

  // 1) 监听 chat_ended 打开猜测表单
  // 当后端在五分钟后发来 chat_ended，你可以在这里把 canGuess 打开
  useEffect(() => {
    // 监听 messages 里是否有 action === "chat_ended"
    if (messages.some((m) => (m as any).action === "chat_ended")) {
      setCanGuess(true);
    }
  }, [messages]);

  // 2) 监听 guess_result，一旦出现就跳回首页
  useEffect(() => {
    const result = (messages as any[]).find(m => m.action === "guess_result");
    if (result) {
      // 可以提示一下结果，比如弹窗或者 toast
      // 然后跳转
      router.push("/");
    }
  }, [messages, router]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({
      sender: role,
      // 对应接收对象的角色硬编码一下
      recipient: role === "I" ? (/* 证人 */ "H") : "I",
      body: input.trim(),
    });
    setInput("");
  };

  const handleGuess = async () => {
    // 审讯者提交最终猜测
    sendMessage({
      action: "guess",
      sender: "I",
      recipient: "server",
      suspect_ai_id: guessAiId,
      suspect_human_id: guessHuId,
      interrogator_id: /* 从 localStorage 或 token 解出的 userId */ "",
    } as any);
  };

  return (
    <Box px={2} py={1}>
      <Typography variant="h6">房间号: {gameId} — 您是 {role}</Typography>
      <Typography>Status: {status}</Typography>

      <List sx={{ height: "60vh", overflowY: "auto", mb: 2 }}>
        {messages.map((m, i) => (
          <ListItem key={i}>
            <ListItemText
              primary={`${m.sender} → ${m.recipient}: ${m.body}`}
              secondary={new Date(m.ts).toLocaleTimeString()}
            />
          </ListItem>
        ))}
      </List>

      {status === "connecting" && <CircularProgress />}

      {/* 聊天输入，仅在聊天阶段可用 */}
      {!canGuess && status === "open" && (
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            placeholder="输入消息…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <Button variant="contained" onClick={handleSend}>
            发送
          </Button>
        </Box>
      )}

      {/* 猜测表单，只给审讯者 && canGuess */}
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
