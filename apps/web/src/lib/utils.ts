import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 更智能的 className 合并：
 *   cn("px-2", isActive && "bg-primary", "px-4")
 *   => "bg-primary px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Promise-based sleep */
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** ISO 时间串 → 本地可读格式 */
export function formatDate(iso: string, locale = "default") {
  return new Date(iso).toLocaleString(locale, {
    hour12: false,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** 不依赖第三方的简单 uuid（前端临时用） */
export const uuid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
