"use client";

import { useState } from "react";
import { Container, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import AuthDialog from "@/components/ui/AuthDialog";
import styles from "@/styles/layout.module.css";

export default function HomePage() {
  const [openDialog, setOpenDialog] = useState(false); // 控制对话框的状态
  const router = useRouter();

  // 点击“开始游戏”时检查 access_token
  const handleStartGame = () => {
    const token = localStorage.getItem("access_token");
    if (!token || !isTokenValid(token)) {
      // 如果没有 token 或 token 无效，弹出登录/注册框
      localStorage.removeItem("access_token");
      setOpenDialog(true);
    } else {
      // token 有效，跳转到匹配队列页面
      router.push("/queue");
    }
  };

  // 认证成功后，保存 access_token 并关闭对话框和跳转
  const handleAuthSuccess = (token: string) => {
    localStorage.setItem("access_token", token);
    setOpenDialog(false);

    // ✅ 强制刷新 queue 页，确保组件获取到最新 token
    router.push("/queue?" + Date.now()); // <-- 关键改动：强制不使用缓存
  };


  return (
    <Container maxWidth="sm" className={styles.centered}>
      <Typography variant="h3" gutterBottom>
        图灵测试
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        你能分辨出聊天对象是人类还是 AI 吗？
      </Typography>
      <Button
        variant="contained"
        color="warning"
        size="large"
        onClick={handleStartGame} // 点击时触发
      >
        开始游戏
      </Button>

      {/* 登录/注册对话框 */}
      <AuthDialog open={openDialog} onCloseAction={() => setOpenDialog(false)}/>
    </Container>
  );
}

// 手动解码 JWT 负载部分
const decodeJwt = (token: string) => {
  const base64Url = token.split('.')[1]; // 获取 JWT 中的第二部分（即负载部分）
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // 转换为标准 Base64 格式
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload); // 将负载部分解析为 JSON 对象
};

// 检查 token 是否有效
const isTokenValid = (token: string) => {
  try {
    const decoded = decodeJwt(token); // 解码 JWT
    const currentTime = Math.floor(Date.now() / 1000); // 获取当前时间戳
    return decoded.exp > currentTime; // 检查 token 是否过期
  } catch {
    alert("Token 解码失败，您需要重新登录"); // 解码失败则认为 token 无效
  }
};