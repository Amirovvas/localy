import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import type { AdminCommunity } from "@/lib/admin";

interface IResponse {
  message: string;
  data: AdminCommunity[];
}

export const useAdminCommunities = () =>
  useQuery({
    queryKey: ["admin", "communities"],
    queryFn: async () => {
      const res = await api.get<IResponse>("/communities/admin");
      return res.data.data;
    },
  });
