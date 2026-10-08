import z from "zod";

const textSchema = z
  .string()
  .trim()
  .min(1, "Сообщение не может быть пустым")
  .max(4000, "Сообщение слишком длинное");

export const startConversationSchema = z.object({
  anonId: z.number().int().positive(),
  text: textSchema,
  communityId: z.number().int().positive().optional(),
});

export const sendDirectMessageSchema = z.object({
  text: textSchema,
});
