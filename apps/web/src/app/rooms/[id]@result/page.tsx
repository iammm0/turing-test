"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams, notFound } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = trpc.game.byId.useQuery({ id });

  if (!data) return notFound();

  return (
    <div className="flex flex-col items-center gap-6 mt-24">
      <h1 className="text-3xl font-bold">
        {data.success ? "🎉 恭喜，你猜对了!" : "😢 很遗憾，猜错啦"}
      </h1>
      <p>你的 Elo 变动：<b>{data.eloDiff > 0 ? "+" : ""}{data.eloDiff}</b></p>
      <Link href="/">
        <Button>返回大厅</Button>
      </Link>
    </div>
  );
}