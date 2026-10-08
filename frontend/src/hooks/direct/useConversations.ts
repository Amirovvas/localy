import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import { useHasToken } from "../auth/useHasToken";
import type { Conversation } from "./types";

interface IResponse {
  message: string;
  data: Conversation[];
}

export const useConversations = () => {
  const hasToken = useHasToken();

  return useQuery({
    queryKey: ["conversations"],
    enabled: hasToken,
    queryFn: async () => {
      const res = await api.get<IResponse>("/conversations");
      return res.data.data;
    },
  });
};
