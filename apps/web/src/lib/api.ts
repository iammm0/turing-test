import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api",
  withCredentials: true, // 如果你的 FastAPI 支持 Cookie
});
