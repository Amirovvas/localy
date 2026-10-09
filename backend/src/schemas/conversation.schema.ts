import z from "zod";

const textSchema = z.string().trim().max(4000, "Сообщение слишком длинное").default("");
const attachmentSchema = z.string().trim().url().optional();

const hasContent = (data: { text: string; attachment?: string | undefined }) =>
  data.text.length > 0 || !!data.attachment;

const emptyMessage = {
  message: "Сообщение не может быть пустым",
  path: ["text"],
};

export const startConversationSchema = z
  .object({
    anonId: z.number().int().positive(),
    text: textSchema,
    attachment: attachmentSchema,
    communityId: z.number().int().positive().optional(),
  })
  .refine(hasContent, emptyMessage);

export const sendDirectMessageSchema = z
  .object({
    text: textSchema,
    attachment: attachmentSchema,
  })
  .refine(hasContent, emptyMessage);
