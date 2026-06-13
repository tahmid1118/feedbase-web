/**
 * Analytics API service
 */

import { apiClient } from "./client";
import type { ApiResponse, AnalyticsOverview } from "./types";

export const analyticsApi = {
  overview: (token?: string) =>
    apiClient.post<ApiResponse<AnalyticsOverview>>(
      "/analytics/overview",
      { lg: "en" },
      { token }
    ),
};
