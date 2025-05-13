import { AuthResponse } from "./types";

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch("http://localhost:8000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error: { detail?: string } = await res.json();
    throw new Error(error.detail || "登录失败");
  }

  return await res.json();
}

export async function apiRegister(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch("http://localhost:8000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error: { detail?: string } = await res.json();
    throw new Error(error.detail || "注册失败");
  }

  return await res.json();
}
