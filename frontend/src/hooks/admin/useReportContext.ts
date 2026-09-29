import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import type { ReportContext } from "@/lib/admin";

interface IResponse {
  message: string;
  data: ReportContext;
}

export const useReportContext = (reportId: number | null) =>
  useQuery({
    queryKey: ["admin", "reportContext", reportId],
    enabled: reportId !== null,
    queryFn: async () => {
      const res = await api.get<IResponse>(`/reports/${reportId}/context`);
      return res.data.data;
    },
  });
