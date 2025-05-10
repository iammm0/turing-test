"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthDialog from "@/components/ui/AuthDialog";
import { Box, Button, Typography } from "@mui/material";

export default function HomePage() {
  const [openDialog, setOpenDialog] = useState(false);
  const router = useRouter();

  const handleStartGame = () => {
    const token = localStorage.getItem("access_token");
    if (!token || !isTokenValid(token)) {
      localStorage.removeItem("access_token");
      setOpenDialog(true);
    } else {
      router.push("/queue?" + Date.now());
    }
  };

  const handleAuthSuccess = (token: string) => {
    localStorage.setItem("access_token", token);
    setOpenDialog(false);
    router.push("/queue?" + Date.now());
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0f0f0f",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        px: 2,
      }}
    >
      <Typography
        variant="h2"
        sx={{
          fontFamily: "monospace",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        TURING TEST
      </Typography>

      <Box
        sx={{
          background: "linear-gradient(to right, #0000ff, #00e5ff)",
          padding: 3,
          borderRadius: 2,
          maxWidth: 600,
          textAlign: "center",
        }}
      >
        <Typography variant="body1" sx={{ color: "#fff" }}>
          Welcome to the Turing Test Game — where intelligence and intuition go
          head-to-head. Are you human enough to fool another human — or smart
          enough to spot the difference?
        </Typography>
      </Box>

      <Button
        variant="contained"
        onClick={handleStartGame}
        sx={{
          mt: 2,
          fontSize: "1.5rem",
          fontWeight: "bold",
          fontFamily: "monospace",
          backgroundColor: "#ffc107",
          color: "#000",
          padding: "12px 24px",
          borderRadius: "12px",
          "&:hover": {
            backgroundColor: "#ffca28",
          },
        }}
      >
        PLAY
      </Button>

      <AuthDialog open={openDialog} onCloseAction={() => setOpenDialog(false)} onAuthSuccess={handleAuthSuccess} />
    </Box>
  );
}

// JWT 校验
const decodeJwt = (token: string) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
};

const isTokenValid = (token: string) => {
  try {
    const decoded = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp > now;
  } catch {
    return false;
  }
};
