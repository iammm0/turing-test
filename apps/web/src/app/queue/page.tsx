"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";

export default function MatchQueue() {
  const router = useRouter();

  // ① 组件挂载即入队
  const enqueue = trpc.match.enqueue.useMutation();
  useEffect(() => {
    enqueue.mutate({ role: "I", elo: 1100 });
  }, [enqueue]);

  // ② 轮询匹配
  const { data } = trpc.match.poll.useQuery(undefined, {
    refetchInterval: 1500,
  });

    return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-xl">正在为你寻找对手…</h1>
      <Progress value={(data?.progress ?? 0) * 10} className="w-64" />
      <Button variant="outline" onClick={() => router.push("/")}>
        取消
      </Button>
    </div>
  );
}
