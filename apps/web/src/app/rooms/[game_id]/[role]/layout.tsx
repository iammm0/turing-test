import {ReactNode} from "react";

export default async function RoomLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ game_id: string; role: string }>;
}) {
  const { role } = await params;
  return (
    <div className={`room room-${role}`}>
      {children}
    </div>
  );
}

