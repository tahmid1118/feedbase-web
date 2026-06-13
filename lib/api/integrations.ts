/**
 * Integrations API service
 */

import { apiClient } from "./client";
import type { ApiResponse, Integration, CreateIntegrationData } from "./types";

export const integrationsApi = {
  create: (data: CreateIntegrationData, token: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(
      "/integrations/create",
      { integrationData: data },
      { token }
    ),

  update: (id: number, data: { config: Record<string, unknown> }, token: string) =>
    apiClient.put<ApiResponse>(
      `/integrations/update/${id}`,
      { integrationData: data },
      { token }
    ),

  delete: (id: number, token: string) =>
    apiClient.delete<ApiResponse>(`/integrations/delete/${id}`, {}, { token }),

  list: (token: string) =>
    apiClient.post<ApiResponse<Integration[]>>("/integrations/list", { lg: "en" }, { token }),

  toggle: (id: number, token: string) =>
    apiClient.patch<ApiResponse>(`/integrations/toggle/${id}`, {}, { token }),
};
