import z from "zod";

const categoryEnum = z.enum(["university", "school", "district", "residential", "city"]);
const statusEnum = z.enum(["active", "pending", "archived"]);
const latSchema = z.number().min(-90).max(90).nullable();
const lngSchema = z.number().min(-180).max(180).nullable();

export const createCommunitySchema = z.object({
  name: z.string().trim().min(1, "Название обязательно"),
  category: categoryEnum,
  city: z.string().trim().min(1, "Город обязателен"),
  description: z.string().trim().optional().default(""),
  status: statusEnum.optional().default("pending"),
  lat: latSchema.optional(),
  lng: lngSchema.optional(),
});

export const updateCommunitySchema = z
  .object({
    name: z.string().trim().min(1, "Название обязательно").optional(),
    category: categoryEnum.optional(),
    city: z.string().trim().min(1, "Город обязателен").optional(),
    description: z.string().trim().optional(),
    status: statusEnum.optional(),
    lat: latSchema.optional(),
    lng: lngSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "Nothing to update");
