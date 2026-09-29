import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { ChatMessage } from "@/lib/chat";

interface IBody {
  roomId: number;
  messageId: number;
}

// удалить своё сообщение (сервер сам проверяет, что оно моё). Сокет
// useRoomSocket уберёт его у остальных участников, а здесь — сразу у себя,
// не дожидаясь эха от сокета
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId }: IBody) => {
      await api.delete(`/messages/${messageId}`);
      return messageId;
    },
    onSuccess: (messageId, variables) => {
      queryClient.setQueryData<ChatMessage[]>(["messages", variables.roomId], (prev) =>
        prev?.filter((message) => message.id !== messageId),
      );
    },
  });
};
