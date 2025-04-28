"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from "@mui/material";
import { useRouter } from "next/navigation";
import styles from "@/styles/layout.module.css";

export default function QueuePage() {
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [role, setRole] = useState<"I" | "W">("I");
  const [matchId, setMatchId] = useState<string>("");
  const [countdown, setCountdown] = useState(60);

  // 建立 WS 连接并发送 join
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
      return;
    }

    const wsHost = window.location.hostname;
    const wsBase = process.env.NEXT_PUBLIC_WS_BASE ||  `ws://${wsHost}:8000/api`;
    const ws = new WebSocket(
      `${wsBase}/ws/match?token=${token}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: "join" }));
    };

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      switch (msg.action) {
        case "match_found":
          // 收到匹配成功通知
          setMatchId(msg.match_id);
          setRole(msg.role);
          setCountdown(msg.window || 60);
          setConfirmOpen(true);
          break;

        case "matched":
          // 双方确认后真正进入游戏
          router.push(`/rooms/${msg.game_id}`);
          break;

        case "timeout":
        case "declined":
          // 超时或拒绝，返回首页
          alert(
            msg.detail || "匹配超时或被拒绝，请重新开始"
          );
          ws.close();
          router.push("/");
          break;

        case "error":
          // token 无效或其他错误
          alert(msg.detail);
          ws.close();
          router.push("/");
          break;
      }
    };

    ws.onclose = () => {
      // 如果用户意外断开，也回首页
      if (!confirmOpen) {
        router.push("/");
      }
    };

    return () => {
      ws.close();
    };
  }, [router]);

  // 确认框倒计时
  useEffect(() => {
    if (!confirmOpen) return;
    if (countdown <= 0) {
      // 超时
      wsRef.current?.send(JSON.stringify({ action: "decline", match_id: matchId }));
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [confirmOpen, countdown, matchId]);

  const handleAccept = () => {
    wsRef.current?.send(JSON.stringify({ action: "accept", match_id: matchId }));
    setConfirmOpen(false);
  };
  const handleDecline = () => {
    wsRef.current?.send(JSON.stringify({ action: "decline", match_id: matchId }));
    setConfirmOpen(false);
  };

  return (
    <Container maxWidth="sm" className={styles.centered}>
      <Typography variant="h5" gutterBottom>
        正在排队匹配，请稍候...
      </Typography>

      <Dialog open={confirmOpen}>
        <DialogTitle>匹配成功</DialogTitle>
        <DialogContent>
          <Typography>
            你被分配为 <strong>{role === "I" ? "审讯者" : "证人"}</strong>
          </Typography>
          <Typography>请在 {countdown} 秒内确认</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDecline}>拒绝</Button>
          <Button onClick={handleAccept} variant="contained" color="primary">
            接受
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
