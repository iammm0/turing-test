import { useEffect, useRef, useState, useCallback } from "react";

export enum ReadyState {
  CONNECTING,
  OPEN,
  CLOSING,
  CLOSED,
}

/**
 * 通用 WebSocket Hook，适用于泛型输入输出模型。
 *
 * @param url - WebSocket 连接地址
 * @param onMessage - 接收到消息时回调（类型安全）
 * @param onOpen - 连接建立时回调
 * @param onClose - 连接关闭时回调
 * @param shouldConnect - 是否启用连接（避免空连接）
 */
export function useWebSocket<TSend extends object = never, TRecv extends object = never>(
  url: string,
  onMessage: (data: TRecv) => void,
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
    setReadyState(ReadyState.CONNECTING); // ✅ 明确标记状态

    ws.onopen = () => {
      if (isClosedManuallyRef.current) return;
      console.log("✅ WebSocket 连接成功");
      setReadyState(ReadyState.OPEN);
      onOpen?.();
    };

    ws.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onMessage(parsed as TRecv);
      } catch {
        console.warn("⚠️ 无法解析 JSON，原始数据为:", e.data);
        onMessage(e.data as TRecv);
      }
    };

    ws.onerror = (e) => {
      console.error("❌ WebSocket 错误:", e);
    };

    ws.onclose = () => {
      if (isClosedManuallyRef.current) return;
      console.warn("🔌 WebSocket 已关闭");
      setReadyState(ReadyState.CLOSED);
      onClose?.();
    };

    return () => {
      isClosedManuallyRef.current = true;
      console.log("🧹 清理 WebSocket 连接");
      setReadyState(ReadyState.CLOSING); // ✅ 准确标记关闭中
      ws.close();
    };
  }, [url, shouldConnect]);

  // ✅ 稳定 sendJson（不依赖外部函数）
  const sendJson = useCallback((msg: TSend) => {
    const socket = wsRef.current;
    if (socket && socket.readyState === ReadyState.OPEN) {
      socket.send(JSON.stringify(msg));
    } else {
      console.warn("⚠️ WebSocket 未连接，无法发送消息:", msg);
    }
  }, []);

  return { sendJson, readyState };
}
