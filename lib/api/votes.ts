/**
 * Votes API service
 */

import { apiClient } from "./client";
import type { ApiResponse, Vote } from "./types";

export const votesApi = {
  add: (postId: number, token: string) =>
    apiClient.post<ApiResponse>("/votes/add", { postId }, { token }),

  remove: (postId: number, token: string) =>
    apiClient.delete<ApiResponse>(`/votes/remove/${postId}`, {}, { token }),

  getByPost: (postId: number, token?: string) =>
    apiClient.post<ApiResponse<Vote[]>>(`/votes/post/${postId}`, { lg: "en" }, { token }),
};
