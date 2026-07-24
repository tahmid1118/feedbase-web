"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

/**
 * Shown at the top of the dashboard when a platform admin entered this workspace
 * via "Open in dashboard" (the session carries a `savedAdmin` snapshot). The
 * admin is operating with a borrowed tenant identity; this bar makes that
 * explicit and restores the admin session in one click — no re-login. Renders
 * nothing for ordinary users.
 */
export function AdminReturnBanner() {
  const { data: session, update } = useSession();
  const { t } = useTranslation();
  const [returning, setReturning] = useState(false);
  const saved = session?.user?.savedAdmin;

  if (!saved) return null;

  const backToAdmin = async () => {
    if (returning) return;
    setReturning(true);
    // Restore the full admin identity and clear the snapshot.
    await update({
      accessToken: saved.accessToken,
      adminId: saved.adminId,
      userId: saved.userId,
      name: saved.name,
      image: saved.image,
      email: saved.email,
      isAdmin: true,
      tenantId: null,
      role: null,
      savedAdmin: null,
    });
    // Hard navigation so the just-written session cookie is used (a soft refresh
    // races the cookie write — same as the workspace switcher / handoff).
    window.location.assign("/admin");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1c0a0c] px-6 py-2 text-sm text-white">
      <span className="inline-flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#e399a3]" />
        {t("admin.adminModeBanner")}
      </span>
      <button
        type="button"
        onClick={backToAdmin}
        disabled={returning}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-3 py-1 font-semibold transition-colors hover:bg-white/10 disabled:opacity-60"
      >
        {returning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowLeft className="h-3.5 w-3.5" />
        )}
        {t("admin.backToAdmin")}
      </button>
    </div>
  );
}
