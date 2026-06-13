/**
 * Posts API service
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  Post,
  CreatePostData,
  PaginationData,
  PaginatedResponse,
  PostStatus,
  PostListFilters,
  DuplicateSuggestion,
} from "./types";

export const postsApi = {
  create: (data: CreatePostData, token: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(
      "/posts/create",
      { postData: data },
      { token }
    ),

  getById: (id: number, token?: string) =>
    apiClient.post<ApiResponse<Post>>(
      `/posts/${id}`,
      { lg: "en" },
      { token }
    ),

  update: (id: number, data: Partial<CreatePostData>, token: string) =>
    apiClient.put<ApiResponse>(
      `/posts/update/${id}`,
      { postData: data },
      { token }
    ),

  delete: (id: number, token: string) =>
    apiClient.delete<ApiResponse>(`/posts/delete/${id}`, {}, { token }),

  list: (
    pagination: PaginationData,
    filters?: PostListFilters,
    token?: string
  ) =>
    apiClient.post<ApiResponse<PaginatedResponse<Post>>>(
      "/posts/list",
      { paginationData: pagination, filters },
      { token }
    ),

  updateStatus: (id: number, newStatus: PostStatus, token: string) =>
    apiClient.patch<ApiResponse>(
      `/posts/status/${id}`,
      { newStatus },
      { token }
    ),

  /** Pin or unpin a post. Omit `isPinned` to toggle the current value. */
  pin: (id: number, token: string, isPinned?: boolean) =>
    apiClient.patch<ApiResponse<{ id: number; isPinned: boolean }>>(
      `/posts/pin/${id}`,
      isPinned === undefined ? {} : { isPinned },
      { token }
    ),

  /** Mark this post as a duplicate of another, or pass `null` to clear it. */
  markDuplicate: (id: number, duplicateOfPostId: number | null, token: string) =>
    apiClient.patch<ApiResponse>(
      `/posts/duplicate/${id}`,
      { duplicateOfPostId },
      { token }
    ),

  duplicateSuggestions: (id: number, token?: string) =>
    apiClient.post<ApiResponse<DuplicateSuggestion[]>>(
      `/posts/${id}/duplicate-suggestions`,
      { lg: "en" },
      { token }
    ),
};
