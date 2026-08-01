import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignupForm } from "@/components/auth/signup-form";
import { getTranslation } from "@/lib/i18n/server";
import { PLAN_INTENT_PARAM } from "@/lib/plan-intent";
import { refreshPlanIntent } from "@/lib/plan-intent-token";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const { t } = await getTranslation();
  const sp = await searchParams;

  // The plan a visitor picked arrives as a signed token. Verify it here (the
  // secret is server-side) and hand the form a fresh one to carry onward; an
  // invalid or expired token becomes null, i.e. an ordinary signup.
  const raw = sp?.[PLAN_INTENT_PARAM];
  const planToken = refreshPlanIntent(typeof raw === "string" ? raw : null);

  if (session?.user?.userId) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c74959]">
          {t("auth.createAccountCta")}
        </p>
        <h1 className="font-heading text-3xl leading-tight text-[#1c0a0c] sm:text-4xl">
          {t("signupPage.heading")}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[#1c0a0c]/70">
          {t("signupPage.subtitle")}
        </p>
      </header>

      <SignupForm planToken={planToken} />
    </div>
  );
}
