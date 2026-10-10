import { api } from "@/lib/api";
import type {
  MentionTrackingResponse,
  NotificationsResponse,
  UserNotification,
} from "./notifications.types";

export const notificationsService = {
  list(
    input: {
      status?: string;
      category?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (input.status) params.set("status", input.status);
    if (input.category) params.set("category", input.category);
    if (input.page) params.set("page", String(input.page));
    if (input.pageSize) params.set("pageSize", String(input.pageSize));
    return api.get<NotificationsResponse>(
      `/notifications?${params.toString()}`,
    );
  },
  markRead(id: string) {
    return api.patch<UserNotification>(`/notifications/${id}/read`, {});
  },
  markAllRead() {
    return api.post<{ updated: number }>("/notifications/read-all");
  },
  dismiss(id: string) {
    return api.delete<UserNotification>(`/notifications/${id}`);
  },
  mentions(input: {
    scope: "MINE" | "ALL";
    status: string;
    page: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams({
      scope: input.scope,
      status: input.status,
      page: String(input.page),
      pageSize: String(input.pageSize ?? 20),
    });
    return api.get<MentionTrackingResponse>(
      `/notifications/mentions?${params}`,
    );
  },
};
