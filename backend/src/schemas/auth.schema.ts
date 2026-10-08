import z from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Имя обязательно"),
  email: z.email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
  city: z.string().trim().min(1, "Выберите город"),
  communityIds: z
    .array(z.number().int().positive())
    .min(1, "Выберите хотя бы одно сообщество"),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Имя обязательно").max(100, "Имя слишком длинное").optional(),
    allowDm: z.boolean().optional(),
  })
  .refine((body) => body.name !== undefined || body.allowDm !== undefined, "Нечего обновлять");

export const loginSchema = z.object({
  email: z.email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});
