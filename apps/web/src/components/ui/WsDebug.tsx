"use client";

import { useWebSocket, ReadyState } from "@/lib/socket"; // 你现有的 hook
import { Box, Typography, Button, Divider } from "@mui/material";

export default function WsDebug() {
  const url1 = "ws://localhost:8000/api/ws/match?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNGJhZjIzNC05NDUyLTQxOTItYjAzZC1mN2QyMWZjYjcxNzQiLCJleHAiOjE3NDY1NTAwNTR9.fA5hRf0Hvb3vcmC98cpjxNXWiHZuZtn7SeWIKB7pPJw";
  const url2 = "ws://localhost:8000/api/ws/match?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZmMzNGM0OC01N2ZhLTRkZDgtYWUxZi02NDY1MTZjNTUxNzciLCJleHAiOjE3NDY1NTAxMDJ9.ANL3O8aULPqYIdgtnxw3bw9U00WtfdIMnxmbySpq5aQ";

  const {
    sendJson: send1,
    readyState: ready1,
  } = useWebSocket(
    url1,
    data => console.log("ws1 received:", data),
    () => console.log("ws1 opened"),
    () => console.log("ws1 closed"),
    true
  );

  const {
    sendJson: send2,
    readyState: ready2,
  } = useWebSocket(
    url2,
    data => console.log("ws2 received:", data),
    () => console.log("ws2 opened"),
    () => console.log("ws2 closed"),
    true
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5">WebSocket 调试面板</Typography>

      <Divider sx={{ my: 2 }} />

      <Typography>连接 1 状态：{ReadyState[ready1]}</Typography>
      <Button
        onClick={() => send1({ action: "join", debug: true })}
        disabled={ready1 !== ReadyState.OPEN}
      >
        向连接 1 发送 join
      </Button>

      <Divider sx={{ my: 2 }} />

      <Typography>连接 2 状态：{ReadyState[ready2]}</Typography>
      <Button
        onClick={() => send2({ action: "join", debug: true })}
        disabled={ready2 !== ReadyState.OPEN}
      >
        向连接 2 发送 join
      </Button>
    </Box>
  );
}
