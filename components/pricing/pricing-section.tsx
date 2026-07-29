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
  // Promotional offers work on both providers (backed by a Stripe coupon or a
  // Paddle discount, auto-applied at checkout), so they're always advertised.
  const offers = (await publicApi.getOffers()) ?? {};
  return <PricingCards offers={offers} ctaHref={ctaHref} />;
}
