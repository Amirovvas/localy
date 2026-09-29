import z from "zod";

export const createRoomSchema = z.object({
  communityId: z.number().int().positive(),
  name: z.string().trim().min(1, "Название обязательно"),
  description: z.string().trim().optional().default(""),
});

export const updateRoomSchema = z
  .object({
    name: z.string().trim().min(1, "Название обязательно").optional(),
    description: z.string().trim().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "Nothing to update");
