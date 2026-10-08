import { useMemo } from "react";
import { useConversations } from "../direct/useConversations";
import { useUnreadCounts } from "./useUnreadCounts";

export const useUnreadSummary = (activeRoomId: number | null) => {
  const { data: counts } = useUnreadCounts();
  const { data: conversations } = useConversations();

  return useMemo(() => {
    const rooms: Record<number, number> = {};
    const communities: Record<number, number> = {};
    let roomsTotal = 0;

    for (const item of counts ?? []) {
      if (item.room_id === activeRoomId) continue;
      rooms[item.room_id] = item.unread;
      communities[item.community_id] = (communities[item.community_id] ?? 0) + item.unread;
      roomsTotal += item.unread;
    }

    const direct = (conversations ?? []).reduce((sum, conversation) => sum + conversation.unread, 0);

    return { rooms, communities, direct, total: roomsTotal + direct };
  }, [counts, conversations, activeRoomId]);
};
