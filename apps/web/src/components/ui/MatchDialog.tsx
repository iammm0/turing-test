"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography,
} from "@mui/material";
import { SenderRole } from "@/lib/types";
import { useEffect, useState } from "react";

interface MatchDialogProps {
  open: boolean;
  matchId: string;
  role: SenderRole;
  windowT: number;
  remainingTime: number;
  acceptAction: () => void;
  declineAction: () => void;
  timeoutAction: () => void;
}

export default function MatchDialog({
  open,
  matchId,
  role,
  windowT,
  acceptAction,
  declineAction,
  timeoutAction,
}: MatchDialogProps) {
  const [timer, setTimer] = useState(windowT);

  useEffect(() => {
    if (!open) return;

    setTimer(windowT);
    const iv = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(iv);
          timeoutAction();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(iv);
  }, [open, windowT, timeoutAction]);

  return (
    <Dialog open={open}>
      <DialogTitle sx={{ fontWeight: 600, fontSize: 20 }}>
        🎯 匹配成功！
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography>
          对局编号: <strong>{matchId}</strong>
        </Typography>
        <Typography>
          你的角色:{" "}
          <strong style={{ color: role === "I" ? "#03a9f4" : "#ffc107" }}>
            {role === "I" ? "审讯者" : "证人"}
          </strong>
        </Typography>

        <Box mt={2}>
          <Typography gutterBottom>
            请在 <strong>{timer}</strong> 秒内确认
          </Typography>
          <LinearProgress
            variant="determinate"
            value={((windowT - timer) / windowT) * 100}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="secondary" onClick={declineAction}>
          拒绝
        </Button>
        <Button variant="contained" color="primary" onClick={acceptAction}>
          接受
        </Button>
      </DialogActions>
    </Dialog>
  );
}
