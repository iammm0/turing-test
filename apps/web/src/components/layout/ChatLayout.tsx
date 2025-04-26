"use client";

import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { ReactNode } from "react";
import { Timer } from "@/components/ui/Timer";

interface Props {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  showDecisionButton?: boolean;
  onDecision?: () => void;
  children: ReactNode;
}

export const ChatLayout = ({
  title = "聊天对局",
  showBackButton = false,
  onBack,
  showDecisionButton = false,
  onDecision,
  children,
}: Props) => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Timer initialSeconds={300} onTimeout={onDecision} />
        <Stack direction="row" spacing={1}>
          {showBackButton && (
            <Button variant="outlined" onClick={onBack}>
              返回
            </Button>
          )}
          {showDecisionButton && (
            <Button variant="contained" onClick={onDecision}>
              做出判决
            </Button>
          )}
        </Stack>
      </Stack>

      <Typography variant="h6" textAlign="center" gutterBottom>
        {title}
      </Typography>

      <Box mt={2}>{children}</Box>
    </Container>
  );
};
