/**
 * API Keys API service
 */

import { apiClient } from "./client";
import type { ApiResponse, ApiKey, CreateApiKeyData } from "./types";

export const apiKeysApi = {
  create: (data: CreateApiKeyData, token: string) =>
    apiClient.post<ApiResponse<{ id: number; key: string }>>(
      "/api-keys/create",
      { apiKeyData: data },
      { token }
    ),

  update: (
    id: number,
    data: { keyName?: string; scopes?: string[] },
    token: string
  ) =>
    apiClient.put<ApiResponse>(`/api-keys/update/${id}`, { apiKeyData: data }, { token }),

  revoke: (id: number, token: string) =>
    apiClient.patch<ApiResponse>(`/api-keys/revoke/${id}`, {}, { token }),

  list: (token: string) =>
    apiClient.post<ApiResponse<ApiKey[]>>("/api-keys/list", { lg: "en" }, { token }),
};
