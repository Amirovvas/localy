import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

interface IBody {
  anonId: number;
  text: string;
  communityId?: number;
}

export const useStartConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: IBody) => {
      const res = await api.post("/conversations", body);
      return res.data.data as { id: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
