import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

export type ConversationAction = "accept" | "decline" | "block" | "unblock";

export const useConversationAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: ConversationAction }) => {
      await api.post(`/conversations/${id}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
