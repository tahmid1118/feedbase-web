/**
 * Tags API service
 */

import { apiClient } from "./client";
import type { ApiResponse, Tag, CreateTagData } from "./types";

export const tagsApi = {
  create: (data: CreateTagData, token: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(
      "/tags/create",
      { tagData: data },
      { token }
    ),

  update: (id: number, data: Partial<CreateTagData>, token: string) =>
    apiClient.put<ApiResponse>(`/tags/update/${id}`, { tagData: data }, { token }),

  delete: (id: number, token: string) =>
    apiClient.delete<ApiResponse>(`/tags/delete/${id}`, {}, { token }),

  list: (token?: string) =>
    apiClient.post<ApiResponse<Tag[]>>("/tags/list", { lg: "en" }, { token }),

  addToPost: (postId: number, tagId: number, token: string) =>
    apiClient.post<ApiResponse>("/tags/add-to-post", { postId, tagId }, { token }),

  removeFromPost: (postId: number, tagId: number, token: string) =>
    apiClient.delete<ApiResponse>("/tags/remove-from-post", { postId, tagId }, { token }),
};
