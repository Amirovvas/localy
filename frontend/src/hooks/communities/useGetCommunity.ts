import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import { formatEventWhen, formatMonth } from "@/lib/format";
import type { ChatCommunityDetail } from "@/lib/chat";

interface RawCommunity {
  id: number;
  name: string;
  category: ChatCommunityDetail["category"];
  city: string;
  description: string;
  members: string;
  rooms: { id: number; name: string; description: string }[];
  events: { id: number; title: string; place: string; starts_at: string; joining_count: number }[];
}

interface IResponse {
  message: string;
  data: RawCommunity;
}

export const useGetCommunity = (id: number | null) =>
  useQuery({
    queryKey: ["communities", id],
    enabled: id !== null,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await api.get<IResponse>(`/communities/${id}`);
      const c = res.data.data;

      const detail: ChatCommunityDetail = {
        id: c.id,
        name: c.name,
        category: c.category,
        city: c.city,
        description: c.description,
        members: Number(c.members),
        rooms: c.rooms.map((room) => ({
          id: room.id,
          name: room.name,
          description: room.description,
        })),
        events: c.events.map((event) => ({
          id: event.id,
          title: event.title,
          place: event.place,
          day: new Date(event.starts_at).getDate(),
          month: formatMonth(event.starts_at),
          when: formatEventWhen(event.starts_at),
        })),
      };

      return detail;
    },
  });
