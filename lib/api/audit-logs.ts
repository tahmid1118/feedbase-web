/**
 * Audit Logs API service
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  AuditLog,
  PaginationData,
  PaginatedResponse,
} from "./types";

export const auditLogsApi = {
  list: (
    pagination: PaginationData,
    filters?: { action?: string; entityType?: string },
    token?: string
  ) =>
    apiClient.post<ApiResponse<PaginatedResponse<AuditLog>>>(
      "/audit-logs/list",
      { paginationData: pagination, filters },
      { token }
    ),

  create: (
    logData: {
      action: string;
      entityType: string;
      entityId?: number;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    },
    token: string
  ) => apiClient.post<ApiResponse>("/audit-logs/create", { logData }, { token }),
};
