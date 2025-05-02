"use client";
import { useEffect } from "react";

export default function RootError({ error }: { error: Error }) {
  // 你可以上报错误到 Sentry/日志系统
  useEffect(() => console.error(error), [error]);

  return (
    <div style={{ padding: 20, textAlign: "center", color: "red" }}>
      <h1>出错啦 😢</h1>
      <p>{error.message}</p>
    </div>
  );
}
