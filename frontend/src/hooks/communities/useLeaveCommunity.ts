import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { ChatCommunity } from "@/lib/chat";

export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: number) => {
      await api.delete(`/communities/${communityId}/leave`);
      return communityId;
    },
    onSuccess: (communityId) => {
      queryClient.setQueryData<ChatCommunity[]>(["communities", "mine"], (prev) =>
        prev?.filter((community) => community.id !== communityId),
      );
      queryClient.removeQueries({ queryKey: ["communities", communityId] });
      queryClient.invalidateQueries({ queryKey: ["communities", "discover"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
