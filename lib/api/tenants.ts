/**
 * Tenants API service
 */

import { apiClient } from "./client";
import type { ApiResponse, Tenant, UpdateTenantData } from "./types";

export const tenantsApi = {
  /** Tenant of the currently authenticated user. */
  getMine: (token: string) =>
    apiClient.get<ApiResponse<Tenant>>("/tenants/me?lg=en", { token }),

  getById: (id: number, token: string) =>
    apiClient.post<ApiResponse<Tenant>>(`/tenants/${id}`, { lg: "en" }, { token }),

  list: (token: string) =>
    apiClient.post<ApiResponse<Tenant[]>>("/tenants", { lg: "en" }, { token }),

  update: (id: number, data: UpdateTenantData, token: string) =>
    apiClient.put<ApiResponse>(`/tenants/update/${id}`, { tenantData: data }, { token }),
};
