"use client";

import { useEffect, useState } from "react";
import { Container, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import AuthDialog from "@/components/AuthDialog"; // 假设你有一个 AuthDialog 组件
import styles from "@/styles/layout.module.css";

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
  } catch (error) {
    return false; // 解码失败则认为 token 无效
  }
};

export default function HomePage() {
  const [openDialog, setOpenDialog] = useState(false); // 控制对话框的状态
  const router = useRouter();

  // 页面加载时检查 token 是否有效
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isTokenValid(token)) {
      // 如果 token 无效，则清除 token
      localStorage.removeItem("token");
      alert("您的会话已过期，请重新登录。");
    }
  }, []); // 只在页面加载时运行一次

  // 用户点击开始游戏时的处理逻辑
  const handleStartGame = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setOpenDialog(true); // 如果没有 token，就弹出登录/注册框
    } else {
      router.push("/queue"); // 如果有 token，直接跳转到匹配队列页面
    }
  };

  // 认证成功后，保存 token 并跳转
  const handleAuthSuccess = (token: string) => {
    localStorage.setItem("token", token); // 将 token 保存到 localStorage
    router.push("/queue"); // 跳转到匹配队列
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
      <AuthDialog open={openDialog} onClose={() => setOpenDialog(false)} onSuccess={handleAuthSuccess} />
    </Container>
  );
}
