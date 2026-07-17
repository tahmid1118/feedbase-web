/**
 * Support chat (user side). Every authenticated tenant user can contact the
 * platform admin. Sessions are open-only for the user — once the admin closes a
 * session it disappears from this API (reads 403), and clicking "Contact
 * support" again starts a fresh one.
 */

import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export type SupportSender = "user" | "admin";

export interface SupportMessage {
  id: number;
  sender: SupportSender;
  body: string;
  created_at: string;
}

export interface SupportSession {
  id: number;
  status: "open" | "closed";
  created_at: string;
  last_message_at: string | null;
}

export interface SupportUnread {
  hasOpenSession: boolean;
  sessionId: number | null;
  unreadCount: number;
}

export const supportApi = {
  /** Resume the caller's open session or start one. */
  openSession: (token: string) =>
    apiClient.post<ApiResponse<{ session: SupportSession }>>(
      "/support/session",
      {},
      { token }
    ),

  /** Messages in an open session the caller owns (marks admin replies read). */
  listMessages: (sessionId: number, token: string) =>
    apiClient.post<ApiResponse<{ messages: SupportMessage[] }>>(
      `/support/messages/${sessionId}/list`,
      {},
      { token }
    ),

  /** Post a message into the caller's open session. */
  sendMessage: (sessionId: number, body: string, token: string) =>
    apiClient.post<ApiResponse>(`/support/messages/${sessionId}`, { body }, { token }),

  /** Unread admin replies for the floating badge. */
  unread: (token: string) =>
    apiClient.post<ApiResponse<SupportUnread>>("/support/unread", {}, { token }),
};
