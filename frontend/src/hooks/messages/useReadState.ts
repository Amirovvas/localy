import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

interface IResponse {
  message: string;
  data: { lastReadMessageId: number | null };
}

// null — пользователь ещё ни разу не открывал эту комнату. ChatArea в этом
// случае считает прочитанным "до нулевого id", то есть вся история в первый
// заход тоже попадает под разделитель "Непрочитанные сообщения"
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
