"use client";

import { Box, Typography } from "@mui/material";
import { useRawWebSocket } from "@/hooks/useRawWebSocket"; // 自行放置路径
import { useEffect, useState } from "react";

export default function WsRawDebug() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    // ✅ 请将此 URL 替换为你在 Postman 能连接成功的 URL
    const rawToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNGJhZjIzNC05NDUyLTQxOTItYjAzZC1mN2QyMWZjYjcxNzQiLCJleHAiOjE3NDY1NTAwNTR9.fA5hRf0Hvb3vcmC98cpjxNXWiHZuZtn7SeWIKB7pPJw";
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const fullUrl = `${proto}://localhost:8000/api/ws/match?token=${rawToken}`;
    setUrl(fullUrl);
  }, []);

  const { status } = useRawWebSocket(url);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">最小 WebSocket 调试器</Typography>
      <Typography>连接地址：{url || "加载中..."}</Typography>
      <Typography>当前连接状态：{status}</Typography>
    </Box>
  );
}
