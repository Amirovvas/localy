import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import { useHasToken } from "../auth/useHasToken";

export interface RoomUnread {
  room_id: number;
  community_id: number;
  unread: number;
}

interface IResponse {
  message: string;
  data: RoomUnread[];
}

export const useUnreadCounts = () => {
  const hasToken = useHasToken();

  return useQuery({
    queryKey: ["messages", "unread"],
    enabled: hasToken,
    queryFn: async () => {
      const res = await api.get<IResponse>("/messages/unread");
      return res.data.data;
    },
  });
};
