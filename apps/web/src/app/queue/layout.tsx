import { ReactNode } from "react";

export default function QueueLayout({ children }: { children: ReactNode }) {
  return (
    <div className="queue-page">
      {/* 可以放进度条、Logo */}
      {children}
    </div>
  );
}