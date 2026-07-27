import { publicApi } from "@/lib/api/public";
import { PricingCards } from "@/components/pricing/pricing-cards";

/**
 * Public pricing (server): fetches any active promotional offers, then hands off
 * to the client `PricingCards` which owns the Monthly/Yearly toggle. Reused on
 * the landing page and the dedicated /pricing page. No payment here — CTAs route
 * to signup; checkout happens in the dashboard after login.
 */
export async function PricingSection({
  ctaHref = "/signup",
}: {
  ctaHref?: string;
}) {
  // Promotional offers are Stripe-only for now (Phase 1); hide them when Paddle
  // is the active provider so we never advertise a discount we can't honor.
  const paddleActive = (process.env.NEXT_PUBLIC_BILLING_PROVIDER ?? "paddle") !== "stripe";
  const offers = paddleActive ? {} : (await publicApi.getOffers()) ?? {};
  return <PricingCards offers={offers} ctaHref={ctaHref} />;
}
