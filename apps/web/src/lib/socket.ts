import { useEffect, useRef, useState, useCallback } from "react";

export enum ReadyState {
  CONNECTING,
  OPEN,
  CLOSING,
  CLOSED,
}

export function useWebSocket(
  url: string,
  onMessage: (data: any) => void,
  onOpen?: () => void,
  onClose?: () => void,
  shouldConnect: boolean = true
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.CLOSED);
  const isClosedManuallyRef = useRef(false); // ✅ 避免闭包问题

  useEffect(() => {
    if (!shouldConnect || !url) {
      console.warn("🛑 WebSocket 未启用或 URL 为空");
      return;
    }

    isClosedManuallyRef.current = false;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    console.log("📡 初始化 WebSocket:", url);

    ws.onopen = () => {
      if (isClosedManuallyRef.current) return;
      console.log("✅ WebSocket 连接成功");
      setReadyState(WebSocket.OPEN);
      onOpen?.();
    };

    ws.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data));
      } catch {
        onMessage(e.data);
      }
    };

    ws.onerror = (e) => {
      console.error("❌ WebSocket 错误:", e);
    };

    ws.onclose = () => {
      if (isClosedManuallyRef.current) return;
      console.warn("🔌 WebSocket 已关闭");
      setReadyState(WebSocket.CLOSED);
      onClose?.();
    };

    return () => {
      isClosedManuallyRef.current = true;
      console.log("🧹 清理 WebSocket 连接");
      ws.close();
    };
  }, [url, shouldConnect]);

  // ✅ 稳定 sendJson（不依赖外部函数）
  const sendJson = useCallback((msg: any) => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    } else {
      console.warn("⚠️ WebSocket 未连接，无法发送消息:", msg);
    }
  }, []);

  return { sendJson, readyState };
}
