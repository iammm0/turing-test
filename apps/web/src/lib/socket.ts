import { useEffect, useRef, useCallback, useState } from "react";

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
  shouldConnect: boolean = true,  // <-- ✅ 添加
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.CLOSED);

  useEffect(() => {
    if (!shouldConnect || !url) return; // <-- ✅ 不连接条件

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setReadyState(ws.readyState);

    ws.onopen = () => {
      setReadyState(ws.readyState);
      onOpen?.();
    };

    ws.onmessage = e => {
      try {
        onMessage(JSON.parse(e.data));
      } catch {
        onMessage(e.data);
      }
    };

    ws.onclose = () => {
      setReadyState(ws.readyState);
      onClose?.();
    };

    ws.onerror = () => {
      console.error("WebSocket error:");
    };

    return () => {
      ws.close();
    };
  }, [url, onMessage, onOpen, onClose, shouldConnect]);

  const sendJson = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("WebSocket not open, cannot send", msg);  // <-- ✅ 安全日志
    }
  }, []);

  return { sendJson, readyState };
}
