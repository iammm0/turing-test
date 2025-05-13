"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "@/hooks/useAuth";

interface AuthDialogProps {
  open: boolean;
  onCloseAction: () => void;
  onAuthSuccess?: (token: string) => void; // 可选回调
}

export default function AuthDialog({ open, onCloseAction, onAuthSuccess }: AuthDialogProps) {
  const { loading, error, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let token: string | null;
      if (mode === "login") {
        token = await login(email, password);
      } else {
        token = await register(email, password);
      }
      if (token && onAuthSuccess) {
        onAuthSuccess(token);
      }
      onCloseAction();
    } catch {
      // handled by useAuth
    }
  };

  return (
    <Dialog open={open} onClose={onCloseAction} maxWidth="xs" fullWidth>
      <Box
        sx={{
          backgroundColor: "#0f0f0f",
          color: "#fff",
          fontFamily: "monospace",
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 2 }}>
          {mode === "login" ? "LOGIN" : "REGISTER"}
          <IconButton
            aria-label="close"
            onClick={onCloseAction}
            sx={{ position: "absolute", right: 8, top: 8, color: "#aaa" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3 }}>
          {mode === "register" && (
            <TextField
              label="Nickname"
              fullWidth
              margin="normal"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              sx={{input: { fontFamily: "monospace", color: "#fff" }, label: { color: "#aaa" },}}
            />
          )}

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{input: { fontFamily: "monospace", color: "#fff" }, label: { color: "#aaa" },}}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            sx={{input: { fontFamily: "monospace", color: "#fff" }, label: { color: "#aaa" },}}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              cursor: "pointer",
              color: "#0ff",
              textDecoration: "underline",
              fontFamily: "monospace",
            }}
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          >
            {mode === "login" ? "No account? Register now" : "Have an account? Log in"}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "center" }}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              loading || !email || !password || (mode === "register" && !displayName)
            }
            sx={{
              backgroundColor: "#ffc107",
              color: "#000",
              fontWeight: "bold",
              fontFamily: "monospace",
              padding: "8px 24px",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#ffca28" },
            }}
          >
            {mode === "login" ? "LOGIN" : "REGISTER"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
