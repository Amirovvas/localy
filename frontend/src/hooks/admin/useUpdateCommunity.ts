import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { CommunityCategory } from "@/lib/mockData";
import type { CommunityStatus } from "@/lib/admin";

interface IBody {
  id: number;
  name: string;
  category: CommunityCategory;
  city: string;
  description: string;
  status: CommunityStatus;
  lat: number | null;
  lng: number | null;
}

export const useUpdateCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: IBody) => {
      const res = await api.put(`/communities/${id}`, body);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "communities"] });
    },
  });
};
