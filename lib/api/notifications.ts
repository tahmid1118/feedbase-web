/**
 * Notifications API service
 */

import { apiClient } from "./client";
import type { ApiResponse, Notification, PaginationData, PaginatedResponse } from "./types";

export const notificationsApi = {
  list: (pagination: PaginationData, token: string) =>
    apiClient.post<ApiResponse<PaginatedResponse<Notification>>>(
      "/notifications/list",
      { paginationData: pagination },
      { token }
    ),

  markRead: (id: number, token: string) =>
    apiClient.patch<ApiResponse>(`/notifications/mark-read/${id}`, {}, { token }),

  markAllRead: (token: string) =>
    apiClient.patch<ApiResponse>("/notifications/mark-all-read", {}, { token }),

  delete: (id: number, token: string) =>
    apiClient.delete<ApiResponse>(`/notifications/delete/${id}`, {}, { token }),

  getUnreadCount: (token: string) =>
    apiClient.post<ApiResponse<{ unreadCount: number }>>(
      "/notifications/unread-count",
      { lg: "en" },
      { token }
    ),
};
