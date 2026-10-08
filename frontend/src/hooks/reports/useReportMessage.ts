import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

export type ReportReason = "spam" | "abuse" | "inappropriate" | "other";

interface IBody {
  messageId: number;
  reason: ReportReason;
  comment: string;
}

export const useReportMessage = () =>
  useMutation({
    mutationFn: async ({ messageId, reason, comment }: IBody) => {
      await api.post(`/messages/${messageId}/report`, { reason, comment });
    },
  });
