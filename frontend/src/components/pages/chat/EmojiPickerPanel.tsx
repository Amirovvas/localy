"use client";
import type { ComponentProps } from "react";
import EmojiPicker, { Categories, EmojiStyle, Theme } from "emoji-picker-react";
import ruData from "emoji-picker-react/dist/data/emojis-ru.json";

type EmojiData = NonNullable<ComponentProps<typeof EmojiPicker>["emojiData"]>;
const ru = ruData as unknown as EmojiData;

interface IProps {
  onSelect: (emoji: string) => void;
}

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

const EmojiPickerPanel = ({ onSelect }: IProps) => (
  <EmojiPicker
    emojiData={ru}
    onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
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
