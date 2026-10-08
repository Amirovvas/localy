import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { ChatMessage } from "@/lib/chat";

export const useClearChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: number) => {
      await api.post(`/messages/clear?roomId=${roomId}`);
      return roomId;
    },
    onSuccess: (roomId) => {
      queryClient.setQueryData<ChatMessage[]>(["messages", roomId], []);
    },
  });
};
