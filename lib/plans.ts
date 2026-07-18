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
  /** i18n key for the plan blurb (translate with t()). */
  blurbKey: string;
  /** i18n keys for the feature bullets (translate each with t()). */
  featureKeys: string[];
  highlighted?: boolean;
}

export const PLANS: PlanDisplay[] = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    blurbKey: "plan.free.blurb",
    featureKeys: [
      "plan.feat.workspace1",
      "plan.feat.publicBoard",
      "plan.feat.roadmapChangelog",
      "plan.feat.unlimitedPosts",
      "plan.feat.upTo2Members",
      "plan.feat.oneSession",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 10,
    blurbKey: "plan.pro.blurb",
    featureKeys: [
      "plan.feat.everythingFree",
      "plan.feat.upTo3Workspaces",
      "plan.feat.photoVideo",
      "plan.feat.contactSubmitters",
      "plan.feat.deletePosts",
      "plan.feat.upTo5Members",
      "plan.feat.oneSession",
    ],
  },
  {
    key: "business",
    name: "Business",
    monthlyPrice: 15,
    blurbKey: "plan.business.blurb",
    featureKeys: [
      "plan.feat.everythingPro",
      "plan.feat.unlimitedWorkspaces",
      "plan.feat.unlimitedMembers",
      "plan.feat.multiDevice",
      "plan.feat.prioritySupport",
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
      // i18n: render with t(billedNoteKey, billedNoteParams).
      billedNoteKey: monthly === 0 ? "pricing.freeForever" : "pricing.billedMonthly",
      billedNoteParams: {} as Record<string, string>,
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
    billedNoteKey: "pricing.billedAnnually",
    billedNoteParams: { total: formatPrice(yearlyTotal) },
    yearlyTotal,
    savingsPercent: Math.round(YEARLY_DISCOUNT * 100),
  };
}
