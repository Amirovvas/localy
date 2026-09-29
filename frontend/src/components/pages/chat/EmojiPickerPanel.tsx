"use client";
import type { ComponentProps } from "react";
import EmojiPicker, { Categories, EmojiStyle, Theme } from "emoji-picker-react";
// именно .json: без расширения бандлер подхватывает emojis-ru.ts из node_modules
// и падает с "Unknown module type"
import ruData from "emoji-picker-react/dist/data/emojis-ru.json";

type EmojiData = NonNullable<ComponentProps<typeof EmojiPicker>["emojiData"]>;
const ru = ruData as unknown as EmojiData;

interface IProps {
  onSelect: (emoji: string) => void;
}

// свои названия категорий: в словаре библиотеки, например, "тело людей" вместо
// "Смайлики и люди"
const CATEGORIES = [
  { category: Categories.SUGGESTED, name: "Недавние" },
  { category: Categories.SMILEYS_PEOPLE, name: "Смайлики и люди" },
  { category: Categories.ANIMALS_NATURE, name: "Животные и природа" },
  { category: Categories.FOOD_DRINK, name: "Еда и напитки" },
  { category: Categories.TRAVEL_PLACES, name: "Путешествия" },
  { category: Categories.ACTIVITIES, name: "Занятия" },
  { category: Categories.OBJECTS, name: "Предметы" },
  { category: Categories.SYMBOLS, name: "Символы" },
  { category: Categories.FLAGS, name: "Флаги" },
];

// вынесено в отдельный файл, чтобы ChatArea подгружал библиотеку и русский
// словарь эмодзи (он тяжёлый) лениво — только когда пользователь открыл панель
const EmojiPickerPanel = ({ onSelect }: IProps) => (
  <EmojiPicker
    emojiData={ru}
    onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
    // системные эмодзи: без загрузки картинок с внешнего CDN
    emojiStyle={EmojiStyle.APPLE}
    theme={Theme.DARK}
    categories={CATEGORIES}
    searchPlaceholder="Поиск эмодзи"
    previewConfig={{ showPreview: false }}
    lazyLoadEmojis
    width={330}
    height={380}
  />
);

export default EmojiPickerPanel;
