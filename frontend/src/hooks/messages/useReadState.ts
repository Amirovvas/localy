import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

interface IResponse {
  message: string;
  data: { lastReadMessageId: number | null };
}

export const useReadState = (roomId: number | null) =>
  useQuery({
    queryKey: ["messages", "read-state", roomId],
    enabled: roomId !== null,
    staleTime: 0,
    queryFn: async () => {
      const res = await api.get<IResponse>("/messages/read-state", { params: { roomId } });
      return res.data.data.lastReadMessageId;
    },
  });
