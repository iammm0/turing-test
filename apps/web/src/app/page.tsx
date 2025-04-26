"use client";

import { Container, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import styles from "@/styles/layout.module.css";

export default function HomePage() {
  const router = useRouter();

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
        onClick={() => router.push("/queue")}
      >
        开始游戏
      </Button>
    </Container>
  );
}
