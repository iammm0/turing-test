"use client";

import { Box, Typography, useTheme } from "@mui/material";
import { Msg } from "@/types";

interface Props extends Msg {
  self: boolean;
}

export const MessageBubble = ({ body, self, sender }: Props) => {
  const theme = useTheme();

  const senderLabel = sender === "A"
    ? "AI"
    : sender === "H"
    ? "Human"
    : "You";

  const align = self ? "flex-end" : "flex-start";
  const bg = self
    ? theme.palette.primary.main
    : theme.palette.grey[200];
  const textColor = self
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems={align}
      sx={{ maxWidth: "80%" }}
    >
      {!self && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 0.5 }}
        >
          {senderLabel}
        </Typography>
      )}

      <Box
        px={2}
        py={1}
        borderRadius={2}
        sx={{
          bgcolor: bg,
          color: textColor,
          boxShadow: 1,
          wordBreak: "break-word",
        }}
      >
        <Typography variant="body2">{body}</Typography>
      </Box>
    </Box>
  );
};
