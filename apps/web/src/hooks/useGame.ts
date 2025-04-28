import {useMutation, useQueryClient} from "@tanstack/react-query";
import {sendMessage} from "@/lib/game";
import {Msg} from "@/types";

export const useSendMessage = (gameId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (msg: Msg) => sendMessage(gameId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", gameId] });
    },
  });
};