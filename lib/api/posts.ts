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
    filters?: { status?: PostStatus; postType?: string },
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
};
