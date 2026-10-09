import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { RoomUnread } from "./useUnreadCounts";

export const useMarkRoomRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: number) => {
      await api.post("/messages/read", null, { params: { roomId } });
    },
    onSuccess: (_, roomId) => {
      queryClient.setQueryData<RoomUnread[]>(["messages", "unread"], (previous) =>
        previous?.filter((item) => item.room_id !== roomId),
      );
    },
  });
};
