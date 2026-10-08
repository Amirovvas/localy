import type { CommunityCategory } from "@/lib/mockData";

export type CommunityStatus = "active" | "pending" | "archived";

export const COMMUNITY_STATUS_LABELS: Record<CommunityStatus, string> = {
  active: "Активно",
  pending: "На модерации",
  archived: "В архиве",
};

export interface AdminCommunityRoom {
  id: number;
  name: string;
}

export interface AdminCommunity {
  id: number;
  name: string;
  category: CommunityCategory;
  city: string;
  description: string;
  status: CommunityStatus;
  lat: number | null;
  lng: number | null;
  created_at: string;
  members: number;
  rooms: AdminCommunityRoom[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  city: string;
  anon_id: number;
  is_admin: boolean;
  is_blocked: boolean;
  created_at: string;
  communities: string[];
}

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Новая",
  reviewing: "На рассмотрении",
  resolved: "Принята",
  dismissed: "Отклонена",
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Спам",
  abuse: "Оскорбления",
  inappropriate: "Неприемлемый контент",
  other: "Другое",
};

export interface AdminReport {
  id: number;
  reason: string;
  comment: string;
  status: ReportStatus;
  message_text: string;
  message_attachment: string | null;
  message_deleted: boolean;
  created_at: string;
  reporter_anon_id: number | null;
  author_anon_id: number | null;
  author_blocked: boolean | null;
  reported_user_id: number | null;
  community_id: number | null;
  community_name: string | null;
  room_id: number | null;
  room_name: string | null;
}

export interface ReportContextMessage {
  text: string;
  attachment: string | null;
  anon_id: number;
}

export interface ReportContext {
  before: ReportContextMessage | null;
  after: ReportContextMessage | null;
}

export interface ReportEvent {
  id: number;
  text: string;
  created_at: string;
}
