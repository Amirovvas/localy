import z from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Имя обязательно"),
  email: z.email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
  city: z.string().trim().min(1, "Выберите город"),
  // хотя бы одно сообщество из любой категории — id из таблицы communities
  communityIds: z
    .array(z.number().int().positive())
    .min(1, "Выберите хотя бы одно сообщество"),
});

// редактирование профиля: пока можно менять только отображаемое имя
// (оно видно лишь самому пользователю и админу, другим показывается Аноним #N)
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Имя обязательно").max(100, "Имя слишком длинное"),
});

export const loginSchema = z.object({
  email: z.email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});
