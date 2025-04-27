import axios from "axios";

// 创建 Axios 实例
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api",
  withCredentials: true, // 如果你的 FastAPI 支持 Cookie
});

// 设置请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem("access_token");
  if (token) {
    console.log("🛡️ 拦截器附加 token:", token);
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log("🛡️ 拦截器未找到 token");
  }
  return config;
});


// 设置响应拦截器（如果需要）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 在这里可以处理响应错误，比如 token 过期时的处理
    return Promise.reject(error);
  }
);

