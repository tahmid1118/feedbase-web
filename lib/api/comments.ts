/**
 * Comments API service
 */

import { apiClient } from "./client";
import type { ApiResponse, Comment, CreateCommentData } from "./types";

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
};
