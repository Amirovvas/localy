import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import { mapMessage, type RawMessage } from "./useGetMessages";

interface IResponse {
  message: string;
  data: RawMessage[];
}

export const useSearchMessages = (roomId: number | null, query: string) =>
  useQuery({
    queryKey: ["messages", "search", roomId, query],
    enabled: roomId !== null && query.trim().length > 0,
    queryFn: async () => {
      const res = await api.get<IResponse>("/messages/search", {
        params: { roomId, q: query },
      });
      return res.data.data.map(mapMessage);
    },
  });
