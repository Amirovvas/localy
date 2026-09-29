import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import { useHasToken } from "@/hooks/auth/useHasToken";
import type { ChatCommunity } from "@/lib/chat";

interface RawCommunity {
  id: number;
  name: string;
  category: ChatCommunity["category"];
  city: string;
  description: string;
  members: string;
}

interface IResponse {
  message: string;
  data: RawCommunity[];
}

export const useGetMyCommunities = () => {
  const hasToken = useHasToken();

  return useQuery({
    queryKey: ["communities", "mine"],
    enabled: hasToken,
    queryFn: async () => {
      const res = await api.get<IResponse>("/communities/mine");
      return res.data.data.map(
        (c): ChatCommunity => ({
          id: c.id,
          name: c.name,
          category: c.category,
          city: c.city,
          description: c.description,
          members: Number(c.members),
        }),
      );
    },
  });
};
