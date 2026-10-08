import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

interface IResponse {
  message: string;
  data: { communities: number; online: number };
}

export const useCommunityStats = () =>
  useQuery({
    queryKey: ["communities", "stats"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await api.get<IResponse>("/communities/stats");
      return res.data.data;
    },
  });
