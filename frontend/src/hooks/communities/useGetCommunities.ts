import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

export type CommunityCategory = "university" | "school" | "district" | "residential";

export interface CommunityOption {
  id: number;
  name: string;
  category: CommunityCategory;
  city: string;
  description: string;
  lat: number | null;
  lng: number | null;
}

interface IResponse {
  message: string;
  data: CommunityOption[];
}

export const useGetCommunities = () =>
  useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await api.get<IResponse>("/communities");
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
