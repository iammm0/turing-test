
import { useEffect, useRef, useState, useCallback } from "react";

export enum ReadyState {
  CONNECTING,
  OPEN,
  CLOSING,
  CLOSED,
}

interface WebSocketOptions<TSend, TRecv> {
  url: string;
  onMessage: (data: TRecv) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  onReconnect?: (attempt: number) => void;
  shouldConnect?: boolean;
  reconnectInterval?: number;
  maxRetries?: number;
}

export function useWebSocket<TSend extends object = never, TRecv extends object = never>({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  onReconnect,
  shouldConnect = true,
  reconnectInterval = 3000,
  maxRetries = 5,
}: WebSocketOptions<TSend, TRecv>) {
  const wsRef = useRef<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.CLOSED);
  const isManuallyClosedRef = useRef(false);
  const retryCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
    onReconnectRef.current = onReconnect;
  }, [onMessage, onOpen, onClose, onError, onReconnect]);

  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setReadyState(ReadyState.CLOSED);
  };

  const connect = useCallback(() => {
    if (!shouldConnect || !url) {
      console.warn("WebSocket disabled or URL missing.");
      return;
    }

    isManuallyClosedRef.current = false;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setReadyState(ReadyState.CONNECTING);

    ws.onopen = () => {
      retryCountRef.current = 0;
      setReadyState(ReadyState.OPEN);
      onOpenRef.current?.();
    };

    ws.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onMessageRef.current?.(parsed as TRecv);
      } catch {
        onMessageRef.current?.(e.data as TRecv);
      }
    };

    ws.onerror = (e) => {
      onErrorRef.current?.(e);
    };

    ws.onclose = () => {
      setReadyState(ReadyState.CLOSED);
      onCloseRef.current?.();
      if (!isManuallyClosedRef.current && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        onReconnect?.(retryCountRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    };
  }, [url, shouldConnect, reconnectInterval, maxRetries]);

  useEffect(() => {
    connect();
    return () => {
      isManuallyClosedRef.current = true;
      reconnectTimeoutRef.current && clearTimeout(reconnectTimeoutRef.current);
      cleanupWebSocket();
    };
  }, [url, shouldConnect, connect]);

  const sendJson = useCallback((msg: TSend) => {
    const socket = wsRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    } else {
      console.warn("⚠️ Cannot send message. WebSocket not connected:", msg);
    }
  }, []);

  const sendRaw = useCallback((raw: string) => {
    const socket = wsRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(raw);
    }
  }, []);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    reconnectTimeoutRef.current && clearTimeout(reconnectTimeoutRef.current);
    cleanupWebSocket();
  }, []);

  return {
    sendJson,
    sendRaw,
    disconnect,
    readyState,
    isConnected: readyState === ReadyState.OPEN,
  };
}
