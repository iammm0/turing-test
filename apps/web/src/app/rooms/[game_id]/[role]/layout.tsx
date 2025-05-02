import { ReactNode } from "react";

export default function RoomLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { game_id: string; role: string };
}) {
  return (
    <div className={`room room-${params.role}`}>
      {/* 这里可以放置房间通用 UI，比如计时器、顶部信息 */}
      {children}
    </div>
  );
}
