import type { CommunityCategory } from "@/lib/mockData";

export interface ChatCommunity {
  id: number;
  name: string;
  category: CommunityCategory;
  city: string;
  description: string;
  members: number;
}

export interface ChatRoom {
  id: number;
  name: string;
  description: string;
}

export interface ChatEvent {
  id: number;
  title: string;
  place: string;
  day: number;
  month: string;
  when: string;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  // поставил ли эту реакцию текущий пользователь
  mine: boolean;
}

export interface ChatReplyPreview {
  id: number;
  authorId: number;
  text: string;
}

export interface ChatMessage {
  id: number;
  authorId: number;
  text: string;
  time: string;
  attachment?: string | null;
  isAnnouncement?: boolean;
  isEdited?: boolean;
  isPinned?: boolean;
  reactions?: ChatReaction[];
  replyTo?: ChatReplyPreview;
}

export interface ChatCommunityDetail extends ChatCommunity {
  rooms: ChatRoom[];
  events: ChatEvent[];
}

// набор для пикера реакций — совпадает с белым списком backend (utils/reactions.ts)
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

// через сокет всем приходят только счётчики без флага "mine" (он у каждого
// свой) — сохраняем его из текущего кэша, а свежий mine придёт из ответа
// собственного POST
export const mergeReactionCounts = (
  prev: ChatReaction[] | undefined,
  counts: { emoji: string; count: number }[],
): ChatReaction[] =>
  counts.map(({ emoji, count }) => ({
    emoji,
    count,
    mine: prev?.find((reaction) => reaction.emoji === emoji)?.mine ?? false,
  }));
