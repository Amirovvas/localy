import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

interface IResponse {
  message: string;
  data: { summary: string; messageCount: number };
}

// просим у сервера AI-сводку комнаты
export const useSummary = () =>
  useMutation({
    mutationFn: async (roomId: number) => {
      const res = await api.post<IResponse>(`/summary/${roomId}`);
      return res.data.data;
    },
  });
