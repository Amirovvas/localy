export type ConversationStatus = "pending" | "accepted" | "blocked";

export interface Conversation {
  id: number;
  status: ConversationStatus;
  is_initiator: boolean;
  blocked_by_me: boolean | null;
  other_anon_id: number;
  community_name: string | null;
  last_text: string | null;
  last_at: string | null;
  last_mine: boolean | null;
  unread: number;
  created_at: string;
}

export interface DirectMessage {
  id: number;
  text: string;
  created_at: string;
  mine: boolean;
}
