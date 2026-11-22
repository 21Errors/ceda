export type NotificationView = "inbox" | "archived";

export interface NotificationItem {
  id: string;
  ideaId: string | null;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface NotificationsPagePayload {
  items: NotificationItem[];
  view: NotificationView;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  unreadCount: number;
  archivedCount: number;
}
