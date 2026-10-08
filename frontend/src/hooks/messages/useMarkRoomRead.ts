import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

export const useMarkRoomRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: number) => {
      await api.post("/messages/read", null, { params: { roomId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "unread"] });
    },
  });
};
