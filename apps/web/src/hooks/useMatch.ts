import { useMutation, useQuery } from "@tanstack/react-query";
import { enqueueMatch, pollMatch } from "@/lib/match";

export const useEnqueueMatch = () =>
  useMutation({ mutationFn: enqueueMatch });

export const usePollMatch = () =>
  useQuery({
    queryKey: ["poll-match"],
    queryFn: pollMatch,
    refetchInterval: 2000, // 可选：自动轮询
  });