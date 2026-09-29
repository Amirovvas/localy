import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import type { ReportEvent } from "@/lib/admin";

interface IResponse {
  message: string;
  data: ReportEvent[];
}

export const useReportEvents = (reportId: number | null) =>
  useQuery({
    queryKey: ["admin", "reportEvents", reportId],
    enabled: reportId !== null,
    queryFn: async () => {
      const res = await api.get<IResponse>(`/reports/${reportId}/events`);
      return res.data.data;
    },
  });
