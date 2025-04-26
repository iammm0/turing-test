"use client";

import { Container, Typography, Button, LinearProgress, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useEnqueueMatch, usePollMatch } from "@/hooks/useMatch";
import styles from "@/styles/layout.module.css";
import {getUserId} from "@/lib/user";
import {uuid} from "@/lib/utils";

export default function MatchQueuePage() {
  const router = useRouter();
  const enqueue = useEnqueueMatch();
  const { data } = usePollMatch();

  // 🔒 设置 user_id 到 localStorage
  useEffect(() => {
    if (!localStorage.getItem("user_id")) {
      localStorage.setItem("user_id", uuid());
    }
  }, []);

  // ✅ 加入匹配队列（只执行一次）
  useEffect(() => {
    if (!enqueue.isPending && !enqueue.isSuccess) {
      const user_id = localStorage.getItem("user_id");
      enqueue.mutate({ role: "I", elo: 1100, user_id: getUserId() });
    }
  }, [enqueue]);


  // ✅ 匹配成功后跳转
  useEffect(() => {
    if (data?.data?.matched && data.data.game_id) {
      const gameId: String = data.data.game_id;
      router.push(`/rooms/${gameId}`);
    }
  }, [data, router]);


  return (
    <Container maxWidth="sm" className={styles.centered}>
      <Typography variant="h5" gutterBottom>
        正在为你寻找对手...
      </Typography>
      <Box sx={{ width: "100%", mt: 2 }}>
        <LinearProgress
          variant="determinate"
          value={(data?.data?.progress ?? 0) * 10}
        />
      </Box>
      <Button
        variant="outlined"
        sx={{ mt: 3 }}
        onClick={() => router.push("/")}
      >
        取消匹配
      </Button>
    </Container>
  );
}
