import type { BillingInterval, PlanKey } from "@/lib/api";

/**
 * A visitor's intent to buy a plan, carried across signup → onboarding →
 * checkout.
 *
 * It travels as ONE opaque signed token (`?c=…`), never as readable
 * `?plan=&interval=` params — see `lib/plan-intent-token.ts` for what that does
 * and does not protect. Signing and verification need a secret, so they are
 * server-only; this module holds just the shape and the link builder, which are
 * safe in a Client Component.
 *
 * The token is verified at every hop rather than trusted, and a token that does
 * not verify means no intent at all — the visitor lands on the dashboard as if
 * they had never picked a plan. That is also what happens to the old plaintext
 * links: they no longer preselect a plan, which is the point.
 */
export interface PlanIntent {
  plan: Extract<PlanKey, "pro" | "business">;
  interval: BillingInterval;
}

/** The plans that can be bought. `free` is never an intent. */
export const PAID_PLANS: readonly string[] = ["pro", "business"];

/** The query param carrying the signed intent. Deliberately meaningless. */
export const PLAN_INTENT_PARAM = "c";

/** `?c=<token>` for forwarding an intent, or "" when there is none. */
export function planIntentQuery(token: string | null | undefined): string {
  return token ? `?${PLAN_INTENT_PARAM}=${encodeURIComponent(token)}` : "";
}
