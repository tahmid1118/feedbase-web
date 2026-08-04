import type { Metadata } from "next";
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
import { legalHref, legalPages } from "@/lib/legal";

const DEFAULT_BRAND = "#c74959";

// Portal data is shared across visitors, so it's a good ISR candidate. This
// takes effect once the public reads are cacheable (they're POST today, which
// Next's Data Cache can't cache — see lib/api/public.ts). Until then the route
// renders dynamically but streams via loading.tsx.
export const revalidate = 30;

/**
 * Resets metadata for the whole portal segment so it stops inheriting the
 * root layout's MARKETING title template/description (added for the root
 * site's own SEO — see CLAUDE.md's SEO section). A tenant's board is white-
 * labeled: it must not silently pick up FeedBoard's own "— FeedBoard" title
 * suffix or its Canny-alternative marketing pitch just because neither was
 * explicitly set at this level.
 *
 * `absolute`, not `default`: confirmed empirically (not just from docs) that
 * a descendant `title.default` STILL gets the nearest ANCESTOR template
 * applied on top when nothing below overrides it — only `title.absolute`
 * actually stops that. `template: "%s"` (identity) is set alongside it so a
 * DEEPER page that provides its own plain-string title (post/[id]'s
 * "<post title> · <tenant name>") also stops at this layout instead of
 * reaching all the way up to the root's "%s — FeedBoard" template.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const info = await publicApi.getTenant(decodeURIComponent(tenant));
  const name = info?.name || "Feedback board";
  return {
    title: { absolute: name, template: "%s" },
    description: info
      ? `${name}'s public feedback board — share feedback, vote on ideas, and see what's planned.`
      : undefined,
  };
}

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
    <div className="flex min-h-screen flex-col bg-[#fdf8f9]">
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
        {/* Wrapped onto two tall lines on a phone, costing ~130px above the fold
            before the visitor saw any of the tenant's own content. */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-1.5 text-center text-xs sm:gap-x-3 sm:px-6 sm:py-2 sm:text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            {t("portal.ownBoardTitle")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-semibold transition-colors group-hover:bg-white/25 sm:px-3 sm:py-1">
            {t("portal.ownBoardCta")}
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </a>

      {/* Brand + language only. The Board/Changelog nav used to live here too,
          which on a phone forced a third wrapped row (logo, then language,
          then a full-width nav row) before any of the tenant's own content —
          the growth bar above it already costs ~130px, so the header alone
          could push "Feedback Board" a full screen down. Two items always fit
          one row (the name truncates), so this needs no wrap/order juggling. */}
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href={`/portal/${decodeURIComponent(tenant)}`}
            className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial sm:gap-3"
          >
            <span className="shrink-0">
              <PortalLogo
                logoUrl={resolveUploadUrl(info.branding_logo_url)}
                name={info.name}
                brand={brand}
              />
            </span>
            <span className="truncate text-base font-bold text-[#1c0a0c] sm:text-lg">
              {info.name}
            </span>
          </Link>

          {/* Visitors are the tenant's own users, so they get their own language
              control — the dashboard navbar isn't shown here. */}
          <div className="shrink-0">
            <LanguageSelector iconColor={brand} className="border-black/10" />
          </div>
        </div>
      </header>

      {/* flex-1 pushes the footer to the bottom of the viewport on short pages. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* The Board/Changelog nav now lives in the page body, above the page's
            own heading, instead of in the header chrome above the fold. */}
        <div className="-mx-1 mb-4 overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0">
          <PortalNav tenant={decodeURIComponent(tenant)} brand={brand} />
        </div>
        {children}
      </main>

      <footer className="mt-auto border-t border-black/5 bg-white">
        {/* The "get your own board" promo lives ONLY in the top bar now — it
            was duplicated here too, showing the same CTA twice on one page.
            Visitors are on OUR infrastructure, so our policies must still be
            reachable from a tenant board, not only from the marketing site. */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-4 text-center text-xs text-[#1c0a0c]/40">
          <span>{t("portal.poweredBy")}</span>
          {legalPages.map((lp) => (
            <a
              key={lp.slug}
              href={appUrl(legalHref(lp.slug))}
              className="transition-colors hover:text-[#c74959] hover:underline"
            >
              {lp.short}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
