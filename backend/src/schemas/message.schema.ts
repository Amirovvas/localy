import z from "zod";

export const createMessageSchema = z
  .object({
    roomId: z.number().int().positive(),
    text: z.string().trim().max(4000, "Сообщение слишком длинное").default(""),
    attachment: z.string().trim().url().optional(),
    isAnnouncement: z.boolean().optional().default(false),
    replyToId: z.number().int().positive().optional(),
  })
  .refine((data) => data.text.length > 0 || !!data.attachment, {
    message: "Сообщение не может быть пустым",
    path: ["text"],
  });

export const forwardMessageSchema = z.object({
  roomId: z.number().int().positive(),
});

export const editMessageSchema = z.object({
  text: z.string().trim().min(1, "Сообщение не может быть пустым").max(4000, "Сообщение слишком длинное"),
});
