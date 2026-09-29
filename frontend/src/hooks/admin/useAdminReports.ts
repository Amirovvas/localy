import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import type { AdminReport } from "@/lib/admin";

interface IResponse {
  message: string;
  data: AdminReport[];
}

// все жалобы сразу (вкладки со статусами фильтруются на клиенте — их немного)
export const useAdminReports = () =>
  useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const res = await api.get<IResponse>("/reports");
      return res.data.data;
    },
  });
