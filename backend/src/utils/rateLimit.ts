import { apiErrors } from "./apiErrors";

// Простой лимит "не больше N сообщений за окно времени" на пользователя —
// против спама. Счётчик в памяти процесса: для одного инстанса backend (как
// сейчас на Render) этого достаточно; при нескольких инстансах понадобится Redis
const MAX_MESSAGES = 5;
const WINDOW_MS = 10_000;

const sentAt = new Map<number, number[]>();

export const assertMessageRate = (userId: number) => {
  const now = Date.now();
  const recent = (sentAt.get(userId) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_MESSAGES) {
    const waitSeconds = Math.ceil((WINDOW_MS - (now - (recent[0] ?? now))) / 1000);
    sentAt.set(userId, recent);
    throw apiErrors.limit(
      `Слишком много сообщений подряд. Подождите ${waitSeconds} сек.`,
    );
  }

  recent.push(now);
  sentAt.set(userId, recent);
};

// чистим записи тех, кто давно молчит, чтобы Map не рос бесконечно
setInterval(() => {
  const now = Date.now();
  for (const [userId, times] of sentAt) {
    if (times.every((time) => now - time >= WINDOW_MS)) sentAt.delete(userId);
  }
}, 60_000).unref();
