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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "@/hooks/useAuth";

interface AuthDialogProps {
  open: boolean;
  onCloseAction: () => void;
}

export default function AuthDialog({
  open,
  onCloseAction,
}: AuthDialogProps) {
  const { user, loading, error, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      // 登陆/注册成功后关闭弹窗
      onCloseAction();
    } catch {
      // error 已由 useAuth 维护，可选地在这里额外处理
    }
  };

  return (
    <Dialog open={open} onClose={onCloseAction}>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {mode === "login" ? "登录" : "注册"}
        <IconButton
          aria-label="close"
          onClick={onCloseAction}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {mode === "register" && (
          <TextField
            label="昵称"
            fullWidth
            margin="normal"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />
        )}

        <TextField
          label="邮箱"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <TextField
          label="密码"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <Typography
          variant="body2"
          sx={{ mt: 1, cursor: "pointer", textDecoration: "underline" }}
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
          }}
        >
          {mode === "login" ? "没有账号？注册一个" : "已有账号？去登录"}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={
            loading ||
            !email ||
            !password ||
            (mode === "register" && !displayName)
          }
        >
          {mode === "login" ? "登录" : "注册"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
