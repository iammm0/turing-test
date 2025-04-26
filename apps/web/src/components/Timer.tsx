"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Timer({ duration, redirect }: { duration: number; redirect: string }) {
  const [left, setLeft] = useState(duration);
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (left <= 0) router.replace(redirect);
  }, [left, router, redirect]);
  return <div className="fixed top-4 right-4 font-mono">{left}s</div>;
}
