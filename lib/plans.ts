/**
 * Subscription plans — display config shared by the dashboard Billing tab and
 * the public pricing page so the two never drift. The enforced limits and
 * Stripe Price IDs live on the backend (`src/consts/plans.js`); this file is
 * purely for presentation.
 */
import type { PlanKey } from "@/lib/api";

export interface PlanDisplay {
  key: PlanKey;
  name: string;
  priceLabel: string;
  priceSuffix: string;
  blurb: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: PlanDisplay[] = [
  {
    key: "free",
    name: "Free",
    priceLabel: "$0",
    priceSuffix: "/mo",
    blurb: "Everything you need to start collecting feedback.",
    features: [
      "Public feedback board",
      "Roadmap & changelog",
      "Unlimited posts & votes",
      "Up to 2 team members",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "$19",
    priceSuffix: "/mo",
    blurb: "For growing teams that need their own brand and tools.",
    features: [
      "Everything in Free",
      "Custom domain",
      "Integrations",
      "Delete feedback posts",
      "Up to 10 team members",
    ],
  },
  {
    key: "business",
    name: "Business",
    priceLabel: "$49",
    priceSuffix: "/mo",
    blurb: "For established products that need to scale support.",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Priority support",
    ],
    highlighted: true,
  },
];

export const planByKey = (key: string): PlanDisplay | undefined =>
  PLANS.find((p) => p.key === key);

/** Plan tier order, for deciding upgrade vs current vs downgrade. */
export const PLAN_ORDER: PlanKey[] = ["free", "pro", "business"];
