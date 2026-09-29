import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { ChatMessage, ChatReaction } from "@/lib/chat";

interface IBody {
  roomId: number;
  messageId: number;
  emoji: string;
}

interface IResponse {
  message: string;
  data: { message_id: number; reactions: ChatReaction[] };
}

// поставить / снять реакцию; ответ содержит актуальные счётчики вместе с
// флагом mine, поэтому кэш обновляется по факту, а не оптимистично
export const useToggleReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: IBody) => {
      const res = await api.post<IResponse>(`/messages/${messageId}/reactions`, { emoji });
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<ChatMessage[]>(["messages", variables.roomId], (prev) =>
        prev?.map((message) =>
          message.id === data.message_id ? { ...message, reactions: data.reactions } : message,
        ),
      );
    },
  });
};
