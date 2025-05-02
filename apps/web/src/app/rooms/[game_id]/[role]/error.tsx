"use client";
export default function RoomError({ error }: { error: Error }) {
  return (
    <div style={{ color: "red" }}>
      <h2>房间加载失败</h2>
      <pre>{error.message}</pre>
    </div>
  );
}