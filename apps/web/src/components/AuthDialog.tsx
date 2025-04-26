import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button } from "@mui/material";
import React, { useState } from "react";

// AuthDialog 组件，负责处理登录/注册逻辑
export default function AuthDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("username", email); // 假设后端的字段是 username
    formData.append("password", password); // 假设后端的字段是 password

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // 设置表单提交类型
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      alert("用户名或密码错误");
      return;
    }

    const data = await response.json();
    onSuccess(data.access_token); // 返回的 token 用于后续请求
    onClose(); // 关闭对话框
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>登录</DialogTitle>
      <DialogContent>
        <TextField
          label="邮箱"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="密码"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          登录
        </Button>
      </DialogActions>
    </Dialog>
  );
}
