import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { publicApi } from "@/lib/api/public";
import { PortalLogo } from "@/components/portal/portal-logo";
import { PortalNav } from "@/components/portal/portal-nav";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { resolveUploadUrl } from "@/lib/avatar";
import { getTranslation } from "@/lib/i18n/server";
import { appUrl } from "@/lib/app-url";

const DEFAULT_BRAND = "#c74959";

// Portal data is shared across visitors, so it's a good ISR candidate. This
// takes effect once the public reads are cacheable (they're POST today, which
// Next's Data Cache can't cache — see lib/api/public.ts). Until then the route
// renders dynamically but streams via loading.tsx.
export const revalidate = 30;

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const { t } = await getTranslation();
  const info = await publicApi.getTenant(decodeURIComponent(tenant));

  if (!info) notFound();

  const brand = info.branding_primary_color || DEFAULT_BRAND;

  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      {/* First-glance growth CTA. A slim bar at the very top of every portal
          page so a visitor sees "get your own board" immediately — not only in
          the footer. FeedBoard's own rose (not the tenant brand): clearly our
          promo. Links to signup on the root domain (absolute — see appUrl). */}
      <a
        href={appUrl("/signup")}
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-[#c74959] text-white transition-colors hover:bg-[#b03f4d]"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-6 py-2 text-center text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Sparkles className="h-4 w-4" />
            {t("portal.ownBoardTitle")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold transition-colors group-hover:bg-white/25">
            {t("portal.ownBoardCta")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </a>

      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href={`/portal/${decodeURIComponent(tenant)}`}
            className="flex items-center gap-3"
          >
            <PortalLogo
              logoUrl={resolveUploadUrl(info.branding_logo_url)}
              name={info.name}
              brand={brand}
            />
            <span className="text-lg font-bold text-[#1c0a0c]">
              {info.name}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <PortalNav tenant={decodeURIComponent(tenant)} brand={brand} />
            {/* Visitors are the tenant's own users, so they get their own
                language control — the dashboard navbar isn't shown here. */}
            <LanguageSelector iconColor={brand} className="border-black/10" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

      <footer className="border-t border-black/5 bg-white">
        {/* FeedBoard promo — a visitor here is a prospect for their own board.
            Uses FeedBoard's own rose, not the tenant brand: this is clearly our
            space, cordoned off in the footer, not part of the tenant's content.
            Links to the app on the root domain (absolute — see appUrl). */}
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c74959]/10 text-[#c74959]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#1c0a0c]">
                {t("portal.ownBoardTitle")}
              </p>
              <p className="text-xs text-[#1c0a0c]/55">
                {t("portal.ownBoardSubtitle")}
              </p>
            </div>
          </div>
          <a
            href={appUrl("/signup")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#c74959] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#b03f4d]"
          >
            {t("portal.ownBoardCta")}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="border-t border-black/5 py-4 text-center text-xs text-[#1c0a0c]/40">
          {t("portal.poweredBy")}
        </div>
      </footer>
    </div>
  );
}
