import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import { mapMessage, type RawMessage } from "./useGetMessages";

interface IResponse {
  message: string;
  data: RawMessage[];
}

export const usePinnedMessages = (roomId: number | null) =>
  useQuery({
    queryKey: ["messages", "pinned", roomId],
    enabled: roomId !== null,
    queryFn: async () => {
      const res = await api.get<IResponse>("/messages/pinned", { params: { roomId } });
      return res.data.data.map(mapMessage);
    },
  });
