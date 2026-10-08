import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { AdminReport, ReportStatus } from "@/lib/admin";

interface IResponse {
  message: string;
  data: AdminReport;
}

const invalidateReport = (queryClient: ReturnType<typeof useQueryClient>, id: number) => {
  queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "reportEvents", id] });
};

export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ReportStatus }) => {
      const res = await api.patch<IResponse>(`/reports/${id}`, { status });
      return res.data.data;
    },
    onSuccess: (_data, variables) => invalidateReport(queryClient, variables.id),
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reports/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
};

export const useDeleteReportedMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post<IResponse>(`/reports/${id}/delete-message`);
      return res.data.data;
    },
    onSuccess: (_data, id) => invalidateReport(queryClient, id),
  });
};

export const useBlockReportAuthor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post<IResponse>(`/reports/${id}/block-author`);
      return res.data.data;
    },
    onSuccess: (_data, id) => invalidateReport(queryClient, id),
  });
};

export const useUnblockReportAuthor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post<IResponse>(`/reports/${id}/unblock-author`);
      return res.data.data;
    },
    onSuccess: (_data, id) => invalidateReport(queryClient, id),
  });
};
