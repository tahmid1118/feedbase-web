/**
 * Comments API service
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  Comment,
  CreateCommentData,
  ModerationState,
} from "./types";

export const commentsApi = {
  create: (data: CreateCommentData, token: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(
      "/comments/create",
      { commentData: data },
      { token }
    ),

  update: (id: number, body: string, token: string) =>
    apiClient.put<ApiResponse>(`/comments/update/${id}`, { body }, { token }),

  delete: (id: number, token: string) =>
    apiClient.delete<ApiResponse>(`/comments/delete/${id}`, {}, { token }),

  getByPost: (postId: number, token?: string) =>
    apiClient.post<ApiResponse<Comment[]>>(`/comments/post/${postId}`, { lg: "en" }, { token }),

  /**
   * Reclassify a comment on the spam axis (owner-only, not plan-gated). Setting
   * `published` is the "Not spam" restore — without it, a quarantined comment
   * was hidden from the public board with no way back.
   */
  updateModeration: (
    id: number,
    moderationState: ModerationState,
    token: string
  ) =>
    apiClient.patch<ApiResponse>(
      `/comments/moderation/${id}`,
      { moderationState },
      { token }
    ),
};
