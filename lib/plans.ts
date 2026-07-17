/**
 * Subscription plans — display config shared by the dashboard Billing tab and
 * the public pricing page so the two never drift. The enforced limits and
 * Stripe Price IDs live on the backend (`src/consts/plans.js`); this file is
 * purely for presentation.
 */
import type { PlanKey } from "@/lib/api";

/** Billing interval; mirrors the backend. */
export type BillingInterval = "month" | "year";

/**
 * The yearly discount — a yearly plan costs 12 months minus this. Kept in sync
 * with the backend's `YEARLY_DISCOUNT` (src/consts/plans.js), which drives the
 * actual Stripe yearly prices. Purely for display here.
 */
export const YEARLY_DISCOUNT = 0.2;

export interface PlanDisplay {
  key: PlanKey;
  name: string;
  /** Monthly list price in whole dollars. Yearly is derived from this. */
  monthlyPrice: number;
  blurb: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: PlanDisplay[] = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    blurb: "Everything you need to start collecting feedback.",
    features: [
      "1 workspace",
      "Public feedback board",
      "Roadmap & changelog",
      "Unlimited posts & votes",
      "Up to 2 team members",
      "One active session at a time",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 19,
    blurb: "For growing teams that need their own brand and tools.",
    features: [
      "Everything in Free",
      "Up to 3 workspaces",
      "Photo & video on feedback",
      "Contact & notify feedback submitters",
      "Delete feedback posts",
      "Up to 5 team members",
      "One active session at a time",
    ],
  },
  {
    key: "business",
    name: "Business",
    monthlyPrice: 49,
    blurb: "For established products that need to scale support.",
    features: [
      "Everything in Pro",
      "Unlimited workspaces",
      "Unlimited team members",
      "Sign in on multiple devices",
      "Priority support",
    ],
    highlighted: true,
  },
];

export const planByKey = (key: string): PlanDisplay | undefined =>
  PLANS.find((p) => p.key === key);

/** Plan tier order, for deciding upgrade vs current vs downgrade. */
export const PLAN_ORDER: PlanKey[] = ["free", "pro", "business"];

/** Format a dollar amount, dropping the decimals when it's a whole number. */
export function formatPrice(amount: number): string {
  return Number.isInteger(amount)
    ? `$${amount}`
    : `$${amount.toFixed(2)}`;
}

/**
 * Display pricing for a plan on a given interval:
 * - `perMonth`   — the headline "$X/mo" figure (yearly shows the discounted
 *   per-month equivalent),
 * - `billedNote` — the sub-line ("billed monthly" / "billed annually ($Y/yr)"),
 * - `yearlyTotal`/`savingsPercent` — for yearly only.
 */
export function planPricing(plan: PlanDisplay, interval: BillingInterval) {
  const monthly = plan.monthlyPrice;
  if (interval === "month" || monthly === 0) {
    return {
      perMonth: monthly,
      perMonthLabel: `${formatPrice(monthly)}`,
      suffix: "/mo",
      billedNote: monthly === 0 ? "Free forever" : "billed monthly",
      yearlyTotal: null as number | null,
      savingsPercent: 0,
    };
  }
  // Round the per-month equivalent to a WHOLE dollar so both it and the annual
  // total stay integers ($19 → $15/mo → $180/yr) — matches the yearly Stripe
  // price created by scripts/stripe-setup.js.
  const perMonth = Math.round(monthly * (1 - YEARLY_DISCOUNT));
  const yearlyTotal = perMonth * 12;
  return {
    perMonth,
    perMonthLabel: formatPrice(perMonth),
    suffix: "/mo",
    billedNote: `billed annually (${formatPrice(yearlyTotal)}/yr)`,
    yearlyTotal,
    savingsPercent: Math.round(YEARLY_DISCOUNT * 100),
  };
}
