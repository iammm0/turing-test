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
import {login, register} from "@/lib/auth";

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

    try {
      let token;

      if (mode === "login") {
        token = await login(email, password);  // 调用 login 函数
      } else {
        token = await register(email, password, displayName);  // 调用 register 函数
        if (!token) {
          alert("注册成功，请手动登录");
          setMode("login");
          return;
        }
      }

      onSuccessAction(token);  // 调用成功回调
      onCloseAction();  // 关闭对话框
    } catch {
      alert("操作失败");
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
