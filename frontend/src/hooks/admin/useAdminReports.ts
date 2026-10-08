import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import type { AdminReport } from "@/lib/admin";

interface IResponse {
  message: string;
  data: AdminReport[];
}

export const useAdminReports = () =>
  useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const res = await api.get<IResponse>("/reports");
      return res.data.data;
    },
  });
