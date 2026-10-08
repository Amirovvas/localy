import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import type { ChatCommunity } from "@/lib/chat";

interface RawCommunity {
  id: number;
  name: string;
  category: ChatCommunity["category"];
  city: string;
  description: string;
  members: string;
  lat: number | null;
  lng: number | null;
}

interface IResponse {
  message: string;
  data: RawCommunity[];
}

export const mapCommunity = (c: RawCommunity): ChatCommunity => ({
  id: c.id,
  name: c.name,
  category: c.category,
  city: c.city,
  description: c.description,
  members: Number(c.members),
  lat: c.lat,
  lng: c.lng,
});

export const useDiscoverCommunities = (search: string, category: string | null) =>
  useQuery({
    queryKey: ["communities", "discover", search, category],
    placeholderData: keepPreviousData,
    gcTime: 0,
    queryFn: async () => {
      const res = await api.get<IResponse>("/communities/discover", {
        params: { search: search || undefined, category: category || undefined },
      });
      return res.data.data.map(mapCommunity);
    },
  });
