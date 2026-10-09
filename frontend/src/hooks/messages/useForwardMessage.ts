import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

export const useForwardMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, roomId }: { messageId: number; roomId: number }) => {
      await api.post(`/messages/${messageId}/forward`, { roomId });
      return roomId;
    },
    onSuccess: (roomId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", roomId], exact: true });
    },
  });
};
