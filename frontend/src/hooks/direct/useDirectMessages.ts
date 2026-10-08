import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import type { DirectMessage } from "./types";

interface IResponse {
  message: string;
  data: DirectMessage[];
}

export const useDirectMessages = (conversationId: number | null) =>
  useQuery({
    queryKey: ["conversations", conversationId, "messages"],
    enabled: conversationId !== null,
    queryFn: async () => {
      const res = await api.get<IResponse>(`/conversations/${conversationId}/messages`);
      return res.data.data;
    },
  });
