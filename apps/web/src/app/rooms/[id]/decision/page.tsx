"use client";

import {
  Container,
  Typography,
  Button,
  Box,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useGuessAI } from "@/hooks/useGame";
import { useState } from "react";

export default function JudgeDecisionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const guessAI = useGuessAI();
  const [loading, setLoading] = useState(false);

  const handleGuess = async (suspectIsA: boolean) => {
    setLoading(true);
    try {
      const res = await guessAI.mutateAsync({
        gameId: id,
        suspect_ai: suspectIsA,
      });

      const { success, eloDiff } = res.data; // 由后端返回
      router.push(`/rooms/${id}/result?success=${success}&eloDiff=${eloDiff}`);
    } catch (e) {
      alert("提交失败，请稍后再试");
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        谁是 AI？
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        请选择你认为是 AI 的证人
      </Typography>

      <Stack spacing={2} direction="column" mt={4}>
        <Button
          variant="contained"
          color="warning"
          size="large"
          disabled={loading}
          onClick={() => handleGuess(true)}
        >
          选择证人 A 是 AI
        </Button>
        <Button
          variant="contained"
          color="warning"
          size="large"
          disabled={loading}
          onClick={() => handleGuess(false)}
        >
          选择证人 B 是 AI
        </Button>
      </Stack>

      {loading && (
        <Box mt={4}>
          <CircularProgress size={28} />
          <Typography variant="caption" display="block" mt={1}>
            正在提交判断...
          </Typography>
        </Box>
      )}
    </Container>
  );
}
