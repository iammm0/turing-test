"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Snackbar,
  Typography,
} from "@mui/material";
import { ReadyState } from "@/lib/socket";
import { SenderRole } from "@/lib/types";
import { useMatch } from "@/hooks/useMatch";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function QueuePage() {
  const router = useRouter();
  const [canConnect, setCanConnect] = useState(false); // 控制是否连接 WebSocket
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // ✅ 页面初始化后判断 token，决定是否启用 useMatch
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/"); // 没有 token，跳转回首页
    } else {
      setCanConnect(true);
    }
  }, [router]);

  // ✅ 使用 useMatch 获取匹配状态
  const {
    status,
    readyState,
    matchId,
    role,
    windowT,
    matchedGameId, // ✅ 这里监听是否完成匹配
    joinQueue,
    leaveQueue,
    acceptMatch,
    declineMatch,
  } = useMatch(canConnect);

  // ✅ 监听匹配成功并完成确认后跳转页面
  useEffect(() => {
    if (matchedGameId && role) {
      router.push(`/rooms/${matchedGameId}/${role}`);
    }
  }, [matchedGameId, role, router]);

  // ✅ 控制确认倒计时
  const [timer, setTimer] = useState<number>(0);
  useEffect(() => {
    if (status === "found" && typeof windowT === "number") {
      setTimer(windowT);
      const iv = setInterval(() => {
        setTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [status, windowT]);

  // ✅ 当连接成功时自动入队；离开时自动退出队列
  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      joinQueue?.();
    }
    return () => {
      if (readyState === ReadyState.OPEN) {
        leaveQueue?.();
      }
    };
  }, [readyState, joinQueue, leaveQueue]);

  // ✅ 匹配失败时提示用户
  useEffect(() => {
    if (status === "idle" && readyState === ReadyState.OPEN) {
      setSnackbar("匹配超时或出错，已返回首页");
    }
  }, [status, readyState]);

  return (
    <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <Card sx={{ width: 360 }}>
        <CardContent sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>图灵测试 · 匹配</Typography>

          {status === "waiting" && (
            <>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>正在排队，请耐心等待其他玩家加入…</Typography>
            </>
          )}

          {status === "idle" && (
            <Button
              variant="contained"
              color="primary"
              onClick={joinQueue}
              size="large"
              disabled={readyState !== ReadyState.OPEN}
            >
              开始匹配
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ✅ 匹配确认弹窗 */}
      <Dialog open={status === "found"}>
        <DialogTitle>匹配成功！</DialogTitle>
        <DialogContent>
          <Typography>
            Match ID：<strong>{matchId}</strong>
          </Typography>
          <Typography>
            你的角色：<strong>{role === SenderRole.I ? "审讯者" : "证人"}</strong>
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>请在 <strong>{timer}</strong> 秒内接受或拒绝</Typography>
            <LinearProgress
              variant="determinate"
              value={windowT ? ((windowT - timer) / windowT) * 100 : 0}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={declineMatch} color="secondary">拒绝</Button>
          <Button onClick={acceptMatch} variant="contained" color="primary">接受</Button>
        </DialogActions>
      </Dialog>

      <Typography variant="caption" color="textSecondary">
        WebSocket 状态：{ReadyState[readyState]}
      </Typography>

      <Snackbar
        open={!!snackbar}
        message={snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
      />
    </Box>
  );
}