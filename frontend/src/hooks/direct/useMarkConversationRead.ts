import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: number) => {
      await api.post(`/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"], exact: true });
    },
  });
};
