import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { ChatMessage } from "@/lib/chat";

// очистить чат "у себя": сервер запоминает момент очистки для (пользователь,
// комната) и больше не отдаёт этому пользователю сообщения до этого момента.
// У остальных участников комнаты история остаётся как была
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
