/**
 * Changelog API service
 */

import { apiClient } from "./client";
import type { ApiResponse, Changelog, CreateChangelogData, PaginationData, PaginatedResponse } from "./types";

export const changelogApi = {
  create: (data: CreateChangelogData, token: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(
      "/changelog/create",
      { changelogData: data },
      { token }
    ),

  update: (id: number, data: Partial<CreateChangelogData>, token: string) =>
    apiClient.put<ApiResponse>(
      `/changelog/update/${id}`,
      { changelogData: data },
      { token }
    ),

  delete: (id: number, token: string) =>
    apiClient.delete<ApiResponse>(`/changelog/delete/${id}`, {}, { token }),

  getById: (id: number, token?: string) =>
    apiClient.post<ApiResponse<Changelog>>(`/changelog/${id}`, { lg: "en" }, { token }),

  list: (pagination: PaginationData, token?: string) =>
    apiClient.post<ApiResponse<PaginatedResponse<Changelog>>>(
      "/changelog/list",
      { paginationData: pagination },
      { token }
    ),

  publish: (id: number, token: string) =>
    apiClient.patch<ApiResponse>(`/changelog/publish/${id}`, {}, { token }),
};
