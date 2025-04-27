"use client";

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState } from "react";

export default function AuthDialog({
  open,
  onCloseAction,
  onSuccessAction,
}: {
  open: boolean;
  onCloseAction: () => void;
  onSuccessAction: (token: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);
    if (mode === "register") {
      formData.append("display_name", displayName);
    }

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const msg = await response.text();
      alert(msg || "操作失败");
      return;
    }

    const data = await response.json();
    const token = data.access_token ?? data.token;
    if (!token) {
      alert("注册成功，请手动登录");
      setMode("login");
      return;
    }

    onSuccessAction(token);
    onCloseAction();
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
            color="warning"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        )}
        <TextField
          label="邮箱"
          fullWidth
          margin="normal"
          color="warning"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="密码"
          type="password"
          fullWidth
          margin="normal"
          color="warning"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Typography
          variant="body2"
          sx={{ mt: 1, cursor: "pointer", textDecoration: "underline" }}
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "没有账号？注册一个" : "已有账号？去登录"}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit} variant="contained" color="warning">
          {mode === "login" ? "登录" : "注册"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
