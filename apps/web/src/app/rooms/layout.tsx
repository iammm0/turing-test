import { ReactNode } from "react";

export default function RoomsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="rooms-root">
      {/* 比如侧边导航：房间列表 / 当前房间 */}
      {children}
    </div>
  );
}
