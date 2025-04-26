"use client";

import { useEffect, useState } from "react";
import { Typography } from "@mui/material";

interface Props {
  initialSeconds: number;
  onTimeout?: () => void;
}

export const Timer = ({ initialSeconds, onTimeout }: Props) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onTimeout?.();
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onTimeout]);

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <Typography variant="caption" color="text.secondary">
      剩余时间：{minutes}:{seconds}
    </Typography>
  );
};