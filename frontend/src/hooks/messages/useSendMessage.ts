import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import { mapMessage, type RawMessage } from "./useGetMessages";
import { formatMessageTime } from "@/lib/format";
import type { ChatMessage, ChatReplyPreview } from "@/lib/chat";

interface IBody {
  roomId: number;
  text: string;
  attachment?: string;
  replyToId?: number;
  // нужны только для оптимистичного сообщения в кэше — на сервер не уходят
  authorId: number;
  replyToPreview?: ChatReplyPreview;
}

interface IResponse {
  message: string;
  data: RawMessage;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: IBody) => {
      const { authorId, replyToPreview, ...payload } = body;
      const res = await api.post<IResponse>("/messages", payload);
      return res.data.data;
    },
    // показываем сообщение в чате сразу, не дожидаясь ответа сервера —
    // отправка иначе ощущается медленной из-за сетевой задержки
    onMutate: async (body) => {
      const tempId = -Date.now();
      const optimistic: ChatMessage = {
        id: tempId,
        authorId: body.authorId,
        text: body.text,
        time: formatMessageTime(new Date().toISOString()),
        attachment: body.attachment,
        reactions: [],
        replyTo: body.replyToPreview,
      };
      queryClient.setQueryData<ChatMessage[]>(["messages", body.roomId], (prev) =>
        prev ? [...prev, optimistic] : [optimistic],
      );
      return { tempId };
    },
    onSuccess: (raw, variables, context) => {
      const message = mapMessage(raw);
      queryClient.setQueryData<ChatMessage[]>(["messages", variables.roomId], (prev) => {
        if (!prev) return [message];
        // убираем временное сообщение и не дублируем, если сокет уже успел
        // доставить это же сообщение раньше, чем резолвился сам HTTP-ответ
        const withoutOptimistic = prev.filter((existing) => existing.id !== context?.tempId);
        if (withoutOptimistic.some((existing) => existing.id === message.id)) {
          return withoutOptimistic;
        }
        return [...withoutOptimistic, message];
      });
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData<ChatMessage[]>(["messages", variables.roomId], (prev) =>
        prev?.filter((existing) => existing.id !== context?.tempId),
      );
    },
  });
};
