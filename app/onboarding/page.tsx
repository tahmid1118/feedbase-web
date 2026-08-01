import { OnboardingForm } from "@/app/onboarding/onboarding-form";
import { PLAN_INTENT_PARAM } from "@/lib/plan-intent";
import { refreshPlanIntent } from "@/lib/plan-intent-token";

/**
 * Server shell for onboarding. Its only job is to verify the signed plan-intent
 * token — the secret is server-side, so a Client Component can neither read nor
 * forge one — and hand the form a freshly signed token to carry to checkout.
 * An invalid or expired token becomes null: the visitor just creates a
 * workspace and lands on the dashboard.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.[PLAN_INTENT_PARAM];
  const planToken = refreshPlanIntent(typeof raw === "string" ? raw : null);

  return <OnboardingForm planToken={planToken} />;
}
