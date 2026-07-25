/**
 * Billing / subscription API service (Stripe Checkout + Customer Portal).
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  BillingInterval,
  BillingStatus,
  PlanChangePreview,
  PlanKey,
} from "./types";

export const billingApi = {
  getStatus: (token: string) =>
    apiClient.post<ApiResponse<BillingStatus>>("/billing/status", {}, { token }),

  // Returns a Stripe Checkout URL to redirect the browser to. `interval` picks
  // monthly (default) or the ~20%-cheaper yearly price; an optional promotionCode
  // (from a redeemed percent-off promo) is applied as a discount.
  checkout: (
    plan: PlanKey,
    token: string,
    opts?: { interval?: BillingInterval; promotionCode?: string }
  ) =>
    apiClient.post<ApiResponse<{ url: string }>>(
      "/billing/checkout",
      {
        plan,
        interval: opts?.interval ?? "month",
        ...(opts?.promotionCode ? { promotionCode: opts.promotionCode } : {}),
      },
      { token }
    ),

  // Returns a Stripe Billing Portal URL.
  portal: (token: string) =>
    apiClient.post<ApiResponse<{ url: string }>>("/billing/portal", {}, { token }),

  // Preview an in-app plan change WITHOUT applying it. For an upgrade it returns
  // the exact prorated `amountDueNow` (in cents); for a downgrade `amountDueNow`
  // is 0 and `effectiveAt` is when it takes effect (period end).
  changePreview: (
    plan: PlanKey,
    token: string,
    opts?: { interval?: BillingInterval }
  ) =>
    apiClient.post<ApiResponse<PlanChangePreview>>(
      "/billing/change/preview",
      { plan, interval: opts?.interval ?? "month" },
      { token }
    ),

  // Apply a plan change: upgrade = prorated charge now; downgrade = scheduled at
  // period end.
  changePlan: (
    plan: PlanKey,
    token: string,
    opts?: { interval?: BillingInterval }
  ) =>
    apiClient.post<ApiResponse<{ direction: "upgrade" | "downgrade"; plan: PlanKey; interval: BillingInterval; effectiveAt?: string | null }>>(
      "/billing/change",
      { plan, interval: opts?.interval ?? "month" },
      { token }
    ),

  // Cancel a scheduled (pending) downgrade — keep the current plan.
  cancelChange: (token: string) =>
    apiClient.post<ApiResponse<{ ok: boolean }>>("/billing/change/cancel", {}, { token }),

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
