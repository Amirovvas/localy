const MONTHS_RU = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

export const formatMonth = (iso: string) => MONTHS_RU[new Date(iso).getMonth()];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatEventWhen = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (isSameDay(date, now)) return `Сегодня, ${time}`;
  if (isSameDay(date, tomorrow)) return `Завтра, ${time}`;
  return `${date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}, ${time}`;
};

export const formatMessageTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export const formatMembers = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = "участников";
  if (mod10 === 1 && mod100 !== 11) word = "участник";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = "участника";
  return `${count.toLocaleString("ru-RU")} ${word}`;
};

export const pluralCommunities = (count: number) => {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "сообществ";
  if (last === 1) return "сообщество";
  if (last >= 2 && last <= 4) return "сообщества";
  return "сообществ";
};

export const formatUnread = (count: number) => (count > 99 ? "99+" : String(count));
