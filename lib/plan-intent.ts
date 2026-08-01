import type { BillingInterval, PlanKey } from "@/lib/api";

/**
 * A visitor's intent to buy a plan, carried across signup → onboarding →
 * checkout as URL params.
 *
 * It is REVALIDATED at every hop rather than trusted: these params are visible
 * and editable in the address bar, and they decide which plan we take money for.
 * An unknown plan, or `free`, means no intent at all — the visitor simply lands
 * on the dashboard as before.
 */
export interface PlanIntent {
  plan: Extract<PlanKey, "pro" | "business">;
  interval: BillingInterval;
}

const PAID: readonly string[] = ["pro", "business"];

/** Read a valid intent from URL params, or null. Interval defaults to yearly. */
export function readPlanIntent(
  params: Pick<URLSearchParams, "get"> | null | undefined
): PlanIntent | null {
  const plan = params?.get("plan");
  if (!plan || !PAID.includes(plan)) return null;
  const raw = params?.get("interval");
  return {
    plan: plan as PlanIntent["plan"],
    // Yearly is the default everywhere, so an absent or junk value lands there
    // rather than quietly selling the more expensive monthly option.
    interval: raw === "month" ? "month" : "year",
  };
}

/** `?plan=pro&interval=year` for forwarding an intent, or "" when there is none. */
export function planIntentQuery(intent: PlanIntent | null): string {
  return intent ? `?plan=${intent.plan}&interval=${intent.interval}` : "";
}
