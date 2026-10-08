import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import { formatMessageTime } from "@/lib/format";
import type { ChatMessage, ChatReaction } from "@/lib/chat";

export interface RawMessage {
  id: number;
  text: string;
  attachment: string | null;
  is_announcement: boolean;
  created_at: string;
  edited_at: string | null;
  pinned_at: string | null;
  anon_id: number;
  reply_to_id: number | null;
  reply_text: string | null;
  reply_anon_id: number | null;
  reactions: ChatReaction[];
}

interface IResponse {
  message: string;
  data: RawMessage[];
}

export const mapMessage = (raw: RawMessage): ChatMessage => ({
  id: raw.id,
  authorId: raw.anon_id,
  text: raw.text,
  time: formatMessageTime(raw.created_at),
  attachment: raw.attachment ?? undefined,
  isAnnouncement: raw.is_announcement,
  isEdited: !!raw.edited_at,
  isPinned: !!raw.pinned_at,
  reactions: raw.reactions ?? [],
  replyTo:
    raw.reply_to_id !== null && raw.reply_text !== null && raw.reply_anon_id !== null
      ? { id: raw.reply_to_id, authorId: raw.reply_anon_id, text: raw.reply_text }
      : undefined,
});

export const useGetMessages = (roomId: number | null) =>
  useQuery({
    queryKey: ["messages", roomId],
    enabled: roomId !== null,
    queryFn: async () => {
      const res = await api.get<IResponse>("/messages", {
        params: { roomId, limit: 50 },
      });
      return res.data.data.map(mapMessage);
    },
  });
