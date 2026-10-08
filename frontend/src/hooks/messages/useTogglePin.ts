import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import { mapMessage, type RawMessage } from "./useGetMessages";
import type { ChatMessage } from "@/lib/chat";

interface IBody {
  roomId: number;
  messageId: number;
}

interface IResponse {
  message: string;
  data: RawMessage;
}

export const useTogglePin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId }: IBody) => {
      const res = await api.post<IResponse>(`/messages/${messageId}/pin`);
      return mapMessage(res.data.data);
    },
    onSuccess: (updated, variables) => {
      queryClient.setQueryData<ChatMessage[]>(["messages", variables.roomId], (prev) =>
        prev?.map((message) => (message.id === updated.id ? updated : message)),
      );
      queryClient.invalidateQueries({ queryKey: ["messages", "pinned", variables.roomId] });
    },
  });
};
