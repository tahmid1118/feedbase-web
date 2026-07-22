import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getTranslation } from "@/lib/i18n/server";

export default async function ForgotPasswordPage() {
  const session = await auth();
  const { t } = await getTranslation();

  if (session?.user?.userId) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c74959]">
          {t("forgotPage.eyebrow")}
        </p>
        <h1 className="font-heading text-3xl leading-tight text-[#1c0a0c] sm:text-4xl">
          {t("forgotPage.heading")}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[#1c0a0c]/70">
          {t("forgotPage.subtitle")}
        </p>
      </header>

      <ForgotPasswordForm />
    </div>
  );
}
