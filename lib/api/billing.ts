/**
 * Billing / subscription API service (Stripe Checkout + Customer Portal).
 */

import { apiClient } from "./client";
import type { ApiResponse, BillingStatus, PlanKey } from "./types";

export const billingApi = {
  getStatus: (token: string) =>
    apiClient.post<ApiResponse<BillingStatus>>("/billing/status", {}, { token }),

  // Returns a Stripe Checkout URL to redirect the browser to.
  checkout: (plan: PlanKey, token: string) =>
    apiClient.post<ApiResponse<{ url: string }>>(
      "/billing/checkout",
      { plan },
      { token }
    ),

  // Returns a Stripe Billing Portal URL.
  portal: (token: string) =>
    apiClient.post<ApiResponse<{ url: string }>>("/billing/portal", {}, { token }),
};
