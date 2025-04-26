import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {getGameById, getGameHistory, getGameMessages, guessAI, sendMessage} from "@/lib/game";
import {Msg} from "@/types";

export const useGameById = (id: string) =>
  useQuery({
    queryKey: ["game", id],
    queryFn: () => getGameById(id),
    enabled: !!id, // 防止 id 为 undefined 时请求
  });

export const useGameHistory = (id: string) =>
  useQuery({
    queryKey: ["game-history", id],
    queryFn: () => getGameHistory(id),
    enabled: !!id,
  });

export const useGuessAI = () =>
  useMutation({
    mutationFn: ({ gameId, suspect_ai }: { gameId: string; suspect_ai: boolean }) =>
      guessAI(gameId, suspect_ai),
  });

export const useChatMessages = (gameId: string) =>
  useQuery({
    queryKey: ["chat", gameId],
    queryFn: () => getGameMessages(gameId),
    refetchInterval: 1000, // 可调，控制聊天刷新频率
  });

export const useSendMessage = (gameId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (msg: Msg) => sendMessage(gameId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", gameId] });
    },
  });
};