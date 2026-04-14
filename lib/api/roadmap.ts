/**
 * Roadmap API service
 */

import { apiClient } from "./client";
import type { ApiResponse, RoadmapColumn, RoadmapItem, CreateRoadmapItemData } from "./types";

export const roadmapApi = {
  // Columns
  createColumn: (data: { name: string; columnKey: string; sortOrder: number }, token: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(
      "/roadmap/column/create",
      { columnData: data },
      { token }
    ),

  updateColumn: (id: number, data: { name?: string; sortOrder?: number }, token: string) =>
    apiClient.put<ApiResponse>(`/roadmap/column/update/${id}`, { columnData: data }, { token }),

  deleteColumn: (id: number, token: string) =>
    apiClient.delete<ApiResponse>(`/roadmap/column/delete/${id}`, {}, { token }),

  getColumns: (token?: string) =>
    apiClient.post<ApiResponse<RoadmapColumn[]>>("/roadmap/columns", { lg: "en" }, { token }),

  // Items
  addItem: (data: CreateRoadmapItemData, token: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(
      "/roadmap/item/add",
      { itemData: data },
      { token }
    ),

  updateItem: (id: number, data: Partial<CreateRoadmapItemData>, token: string) =>
    apiClient.put<ApiResponse>(`/roadmap/item/update/${id}`, { itemData: data }, { token }),

  removeItem: (id: number, token: string) =>
    apiClient.delete<ApiResponse>(`/roadmap/item/remove/${id}`, {}, { token }),

  getItems: (token?: string) =>
    apiClient.post<ApiResponse<RoadmapItem[]>>("/roadmap/items", { lg: "en" }, { token }),
};
