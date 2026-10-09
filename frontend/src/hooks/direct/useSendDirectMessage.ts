import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { DirectMessage } from "./types";

export const useSendDirectMessage = (conversationId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { text: string; attachment?: string }) => {
      const res = await api.post(`/conversations/${conversationId}/messages`, body);
      return res.data.data as DirectMessage;
    },
    onSuccess: (message) => {
      queryClient.setQueryData<DirectMessage[]>(
        ["conversations", conversationId, "messages"],
        (prev) => {
          if (!prev) return prev;
          if (prev.some((existing) => existing.id === message.id)) return prev;
          return [...prev, message];
        },
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"], exact: true });
    },
  });
};
