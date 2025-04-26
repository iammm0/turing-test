export function connectSocket(gameId: string, role: "I" | "A" | "H") {
  const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS}/api/ws/rooms/${gameId}/${role}`);
  return ws;
}