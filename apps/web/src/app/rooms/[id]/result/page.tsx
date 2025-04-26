"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Stack,
} from "@mui/material";

export default function ResultPage() {
  const search = useSearchParams();
  const router = useRouter();

  const success = search.get("success") === "true";
  const eloDiff = Number(search.get("eloDiff")) || 0;
  const timeout = search.get("timeout") === "true";

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Typography variant="h4" gutterBottom>
          {timeout
            ? "⌛ 时间结束"
            : success
            ? "🎉 恭喜，你猜对了！"
            : "😢 很遗憾，猜错了"}
        </Typography>

        {!timeout && (
          <Typography
            variant="h6"
            color={eloDiff > 0 ? "success.main" : "error.main"}
            mt={2}
          >
            Elo 变动：{eloDiff > 0 ? "+" : ""}
            {eloDiff}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" mt={2}>
          {timeout
            ? "请等待系统自动判定或裁判决定结果"
            : "你可以重新挑战一次！"}
        </Typography>

        <Stack direction="column" spacing={2} mt={4}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push("/")}
          >
            返回大厅
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
