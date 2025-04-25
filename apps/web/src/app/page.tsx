import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Lobby() {
  return (
    <main className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Turing-Test Lobby</h1>

      <Link href="/queue">
        <Button size="lg">开始匹配</Button>
      </Link>

      {/* TODO: 排行榜 / 历史 Tab */}
    </main>
  );
}