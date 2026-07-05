/**
 * Billing / subscription API service (Stripe Checkout + Customer Portal).
 */

import { apiClient } from "./client";
import type { ApiResponse, BillingStatus, PlanKey } from "./types";

export const billingApi = {
  getStatus: (token: string) =>
    apiClient.post<ApiResponse<BillingStatus>>("/billing/status", {}, { token }),

  // Returns a Stripe Checkout URL to redirect the browser to. An optional
  // promotionCode (from a redeemed percent-off promo) is applied as a discount.
  checkout: (plan: PlanKey, token: string, promotionCode?: string) =>
    apiClient.post<ApiResponse<{ url: string }>>(
      "/billing/checkout",
      promotionCode ? { plan, promotionCode } : { plan },
      { token }
    ),

  // Returns a Stripe Billing Portal URL.
  portal: (token: string) =>
    apiClient.post<ApiResponse<{ url: string }>>("/billing/portal", {}, { token }),

  // Redeem a promo code. Free-plan codes apply instantly; percent-off codes
  // return a Stripe promotion code to pass into checkout.
  redeem: (code: string, token: string) =>
    apiClient.post<
      ApiResponse<{
        type: "free_plan" | "percent_off";
        plan?: string;
        percentOff?: number;
        appliesToPlan?: string;
        promotionCode?: string;
      }>
    >("/billing/redeem", { code }, { token }),
};
