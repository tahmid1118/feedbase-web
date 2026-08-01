import { CheckoutForm } from "@/app/checkout/checkout-form";
import { PLAN_INTENT_PARAM } from "@/lib/plan-intent";
import { refreshPlanIntent, verifyPlanIntent } from "@/lib/plan-intent-token";

/**
 * Server shell for checkout. It verifies the signed plan-intent token and hands
 * the decoded plan/interval down — the client never parses the URL, so what we
 * are about to charge for cannot be changed by editing the address bar.
 *
 * A token that does not verify yields no intent, and the form sends the visitor
 * to the dashboard rather than to a payment for an unknown plan.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.[PLAN_INTENT_PARAM];
  const token = typeof raw === "string" ? raw : null;

  return (
    <CheckoutForm intent={verifyPlanIntent(token)} planToken={refreshPlanIntent(token)} />
  );
}
