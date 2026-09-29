import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import { mapMessage, type RawMessage } from "./useGetMessages";
import type { ChatMessage } from "@/lib/chat";

interface IBody {
  roomId: number;
  text: string;
  attachment?: string;
  replyToId?: number;
}

interface IResponse {
  message: string;
  data: RawMessage;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: IBody) => {
      const res = await api.post<IResponse>("/messages", body);
      return res.data.data;
    },
    onSuccess: (raw, variables) => {
      const message = mapMessage(raw);
      queryClient.setQueryData<ChatMessage[]>(["messages", variables.roomId], (prev) => {
        if (!prev) return [message];
        // сокет (useRoomSocket) часто доставляет это же сообщение раньше, чем
        // резолвится сам HTTP-ответ — без проверки на id оно задваивалось бы
        if (prev.some((existing) => existing.id === message.id)) return prev;
        return [...prev, message];
      });
    },
  });
};
