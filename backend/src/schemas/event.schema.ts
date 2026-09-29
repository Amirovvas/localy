import z from "zod";

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");

export const createEventSchema = z.object({
  communityId: z.number().int().positive(),
  title: z.string().trim().min(1, "Название обязательно"),
  place: z.string().trim().optional().default(""),
  startsAt: isoDate,
});

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1, "Название обязательно").optional(),
    place: z.string().trim().optional(),
    startsAt: isoDate.optional(),
    joiningCount: z.number().int().min(0).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "Nothing to update");
