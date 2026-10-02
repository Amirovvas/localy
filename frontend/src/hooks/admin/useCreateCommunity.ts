import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { CommunityCategory } from "@/lib/mockData";
import type { CommunityStatus } from "@/lib/admin";

interface IBody {
  name: string;
  category: CommunityCategory;
  city: string;
  description: string;
  status: CommunityStatus;
  lat: number | null;
  lng: number | null;
}

export const useCreateCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: IBody) => {
      const res = await api.post("/communities", body);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "communities"] });
    },
  });
};
