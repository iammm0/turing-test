import { useEffect, useState } from "react";

export function useRawWebSocket(url: string) {
  const [status, setStatus] = useState<"connecting" | "open" | "closed" | "error">("connecting");

  useEffect(() => {
    if (!url) return;

    console.log("📡 Connecting to:", url);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("✅ WebSocket opened");
      setStatus("open");
    };

    ws.onmessage = (e) => {
      console.log("📨 Received:", e.data);
    };

    ws.onerror = (e) => {
      console.error("❌ WebSocket error", e);
      setStatus("error");
    };

    ws.onclose = () => {
      console.warn("🔌 WebSocket closed");
      setStatus("closed");
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { status };
}
