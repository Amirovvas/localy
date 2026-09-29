import z from "zod";

export const REPORT_REASONS = ["spam", "abuse", "inappropriate", "other"] as const;

export const createReportSchema = z
  .object({
    reason: z.enum(REPORT_REASONS, { message: "Выберите причину жалобы" }),
    comment: z.string().trim().max(500, "Комментарий слишком длинный (максимум 500 символов)").default(""),
  })
  // при "Другое" причина неочевидна — без пояснения модератору нечего проверять
  .refine((data) => data.reason !== "other" || data.comment.length >= 3, {
    message: "Опишите, что не так с сообщением",
    path: ["comment"],
  });

export const REPORT_STATUSES = ["pending", "reviewing", "resolved", "dismissed"] as const;

export const updateReportStatusSchema = z.object({
  status: z.enum(REPORT_STATUSES, { message: "Недопустимый статус жалобы" }),
});
