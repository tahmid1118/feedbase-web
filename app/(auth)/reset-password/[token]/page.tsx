import Link from "next/link";
import { KeyRound } from "lucide-react";

import { publicApi } from "@/lib/api/public";
import { getLanguage, getTranslation } from "@/lib/i18n/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { t } = await getTranslation();
  const lng = await getLanguage();

  // Validate server-side before rendering — the token is single-use and
  // 1-hour-lived, so most bad links (expired, reused, mistyped) are caught here.
  const valid = await publicApi.validateResetToken(token, lng);

  if (!valid) {
    return (
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c74959]">
            {t("resetPage.eyebrow")}
          </p>
          <h1 className="font-heading text-3xl leading-tight text-[#1c0a0c] sm:text-4xl">
            {t("resetPage.invalidTitle")}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#1c0a0c]/70">
            {t("resetPage.invalidBody")}
          </p>
        </header>
        <Link
          href="/forgot-password"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#c74959] px-5 text-sm font-semibold text-[#fdf8f9] hover:bg-[#b53f4d]"
        >
          <KeyRound className="h-4 w-4" />
          {t("resetPage.requestNew")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c74959]">
          {t("resetPage.eyebrow")}
        </p>
        <h1 className="font-heading text-3xl leading-tight text-[#1c0a0c] sm:text-4xl">
          {t("resetPage.heading")}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[#1c0a0c]/70">
          {t("resetPage.subtitle", { email: valid.email })}
        </p>
      </header>

      <ResetPasswordForm token={token} />
    </div>
  );
}
