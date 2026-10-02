import { apiErrors } from "./apiErrors";

// Корни запрещённых слов (русский мат и самые частые оскорбления). Проверка
// идёт по началу слова, поэтому корень ловит и все формы слова. Список можно
// спокойно дополнять — просто добавь ещё корень в массив
const BANNED_STEMS = [
  "хуй",
  "хуе",
  "хуя",
  "хуё",
  "пизд",
  "бляд",
  "блят",
  "блять",
  "ебан",
  "ебат",
  "ебал",
  "ебну",
  "еблан",
  "заеб",
  "уеб",
  "пидор",
  "пидар",
  "пидр",
  "мудак",
  "мудил",
  "гандон",
  "залуп",
  "шлюх",
  "долбоеб",
  "сучар",
  "сукин",
  "fuck",
  "shit",
  "bitch",
  "cunt",
];

// слова, которые блокируем только целиком (по корню были бы ложные срабатывания,
// например на фамилию Сукачев)
const EXACT_WORDS = ["сука", "суки", "суку", "суке", "сукой", "сукам", "суками"];

// латинские буквы, похожие на русские, и цифры-подмены — чтобы "xуй", "6лядь"
// и "pizda" не проходили проверку
const LOOKALIKES: Record<string, string> = {
  a: "а", e: "е", o: "о", p: "р", c: "с", x: "х", y: "у", k: "к", m: "м", h: "н", b: "в", t: "т",
  "0": "о", "3": "з", "6": "б", "4": "ч",
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/ё/g, "е")
    .split("")
    .map((char) => LOOKALIKES[char] ?? char)
    .join("");

// латиница из списка выше: проверяем по исходному тексту (без подмены букв),
// иначе "shit" превратилось бы в кашу
const LATIN_STEMS = BANNED_STEMS.filter((stem) => /^[a-z]+$/.test(stem));
const CYRILLIC_STEMS = BANNED_STEMS.filter((stem) => !/^[a-z]+$/.test(stem)).map((stem) =>
  stem.replace(/ё/g, "е"),
);

const startsWithStem = (word: string, stems: string[]) =>
  stems.some((stem) => word.startsWith(stem));

export const containsBannedWords = (text: string) => {
  const words = (value: string) => value.split(/[^a-zа-я0-9]+/).filter(Boolean);

  const plainWords = words(text.toLowerCase().replace(/ё/g, "е"));
  if (plainWords.some((word) => startsWithStem(word, LATIN_STEMS))) return true;

  return words(normalize(text)).some(
    (word) => startsWithStem(word, CYRILLIC_STEMS) || EXACT_WORDS.includes(word),
  );
};

export const assertNoBannedWords = (text?: string) => {
  if (text && containsBannedWords(text)) {
    throw apiErrors.badRequest("Сообщение содержит запрещённые слова");
  }
};
