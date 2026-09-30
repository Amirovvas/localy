import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import { mapMessage, type RawMessage } from "./useGetMessages";
import type { ChatMessage } from "@/lib/chat";

interface IBody {
  roomId: number;
  messageId: number;
  text: string;
}

interface IResponse {
  message: string;
  data: RawMessage;
}

// редактировать можно только своё сообщение (сервер сам проверяет). Сокет
// useRoomSocket обновит его у остальных участников, а здесь — сразу у себя
export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, text }: IBody) => {
      const res = await api.patch<IResponse>(`/messages/${messageId}`, { text });
      return mapMessage(res.data.data);
    },
    onSuccess: (updated, variables) => {
      queryClient.setQueryData<ChatMessage[]>(["messages", variables.roomId], (prev) =>
        prev?.map((message) => (message.id === updated.id ? updated : message)),
      );
    },
  });
};
