import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

interface IBody {
  communityId: number;
  title: string;
  place?: string;
  startsAt: string;
}

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: IBody) => {
      const res = await api.post("/events", body);
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["communities", variables.communityId] });
    },
  });
};
