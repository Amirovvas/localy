import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import { mapCommunity } from "./useDiscoverCommunities";

export const useJoinCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: number) => {
      const res = await api.post(`/communities/${communityId}/join`);
      return mapCommunity(res.data.data);
    },
    onSuccess: () => {
      // мои сообщества изменились, а список "можно вступить" — тоже
      queryClient.invalidateQueries({ queryKey: ["communities", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["communities", "discover"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
