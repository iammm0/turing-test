import {useMutation, useQuery} from "@tanstack/react-query";
import {acceptMatch, enqueueMatch, pollMatch} from "@/lib/match";

/**
 * Hook: 调用 enqueueMatch 以加入匹配队列
 */
export const useEnqueueMatch = () =>
  useMutation({
    mutationFn: enqueueMatch,
    onError: (error: Error) => {
      console.error("加入匹配队列失败:", error);
    },
  });

/**
 * Hook: 自动轮询 pollMatch
 * 每 2 秒刷新一次匹配状态
 */
export const usePollMatch = () =>
  useQuery({
    queryKey: ["poll-match"],
    queryFn: pollMatch,
    refetchInterval: 2000,
  });


export const useAcceptMatch = () =>
  useMutation({
    mutationFn: acceptMatch,
    onError: (error: Error) => {
      console.error("接受匹配失败:", error);
    },
  });