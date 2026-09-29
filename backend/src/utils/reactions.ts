// разрешённые реакции — тот же набор показывается в пикере на фронтенде.
// Белый список нужен, чтобы в таблицу нельзя было писать произвольный текст
export const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"] as const;

export type AllowedReaction = (typeof ALLOWED_REACTIONS)[number];
