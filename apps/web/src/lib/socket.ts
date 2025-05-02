// lib/socket.ts
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
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.CLOSED);

  useEffect(() => {
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
      // 这里可以做错误上报
    };

    return () => {
      ws.close();
    };
  }, [url, onMessage, onOpen, onClose]);

  const sendJson = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { sendJson, readyState };
}
