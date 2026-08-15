import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, BarChart3, Camera, CheckCircle2, GitBranch, Globe, MessageSquare, Users, Vote } from "@/components/icons";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PricingSection } from "@/components/pricing/pricing-section";
import { FeedbackLoopFlow } from "@/components/landing/feedback-loop-flow";
import { AdSwap } from "@/components/landing/ad-swap";
import { AuraBadge } from "@/components/landing/aura-badge";
import { BoostDomainRatingBadge } from "@/components/landing/boost-domain-rating-badge";
import { FazierBadge } from "@/components/landing/fazier-badge";
import { LaunchZoneBadge } from "@/components/landing/launchzone-badge";
import { ToolfioBadge } from "@/components/landing/toolfio-badge";
import { TwelveToolsBadge } from "@/components/landing/twelve-tools-badge";
import { PostTypeIcon } from "@/components/feedback/post-type-icon";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { getTranslation } from "@/lib/i18n/server";
import { officialBoardUrl } from "@/lib/official-board";
import { legalHref, legalPages } from "@/lib/legal";
import { appUrl } from "@/lib/app-url";
import { PLANS } from "@/lib/plans";

// Overrides the root layout's default title (the layout's is the <title>
// fallback for pages that don't set their own — this page always should,
// being the one most likely to actually be searched). Description leans on
// both the category terms and the competitor-alternative framing per the SEO
// design — see CLAUDE.md's SEO section.
export const metadata: Metadata = {
  // `absolute` bypasses the root layout's `%s — FeedBoard` template — this is
  // the one page where the brand belongs at the FRONT of the title, not
  // appended to it, since it's the homepage title Google shows for brand
  // searches. A plain string here would otherwise get the template applied
  // too, producing "...— FeedBoard — FeedBoard".
  title: { absolute: "FeedBoard — Feedback Board & Public Roadmap Software" },
  description:
    "Collect product feedback, let users vote on what matters, and share a public roadmap and changelog. A Canny/UserJot alternative with anonymous feedback on the free plan — free forever, no card required.",
  alternates: { canonical: appUrl("/") },
};

/**
 * SoftwareApplication structured data — lets Google render pricing directly
 * in the search result. Pulls prices from lib/plans.ts (the same source the
 * pricing page and dashboard Billing tab use) rather than restating them, so
 * this can't drift from what's actually charged.
 */
function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FeedBoard",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Collect product feedback, let users vote on what matters, and share a public roadmap and changelog.",
    url: appUrl("/"),
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.monthlyPrice),
      priceCurrency: "USD",
      url: appUrl("/pricing"),
    })),
  };
}

/**
 * Marketing landing page.
 *
 * Design notes:
 *
 *  - Typography is the same single IBM Plex Sans family as the rest of the
 *    app (`lib/fonts.ts`) — no longer a landing-only display face.
 *  - The dark gradient band (`linear-gradient(145deg,#1c0a0c,#7a2d38,#c74959)`)
 *    recurs three times (facts ledger, "What comes in", closing CTA) — one
 *    material reused down the page rather than re-derived per section.
 *  - The hero's own visual is the full FeedbackLoopFlow "How it works"
 *    diagram (`components/landing/feedback-loop-flow.tsx`), promoted here
 *    from its own separate section — it renders its own heading/background,
 *    so the hero above it is just centred copy + CTAs.
 *  - Motion is deliberate but no longer minimal: FeedbackLoopFlow's own
 *    scroll-triggered reveals and floating figures, plus `lp-card-float`
 *    (globals.css) on the glass cards/chips — all disabled under
 *    `prefers-reduced-motion`.
 */

/** Small caps label used to open a section. Mono, so it reads as metadata. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] font-medium tracking-[0.18em] text-[#c74959] uppercase">
      {children}
    </span>
  );
}

export default async function HomePage() {
  const session = await auth();
  const { t } = await getTranslation();

  if (session?.user?.userId) {
    redirect("/dashboard");
  }

  // "Works for anything people use" — the use-case chips.
  const useCases = [
    { key: "landing.uses.saas" },
    { key: "landing.uses.mobile" },
    { key: "landing.uses.ecommerce" },
    { key: "landing.uses.games" },
    { key: "landing.uses.agencies" },
    { key: "landing.uses.hardware" },
    { key: "landing.uses.services" },
    { key: "landing.uses.communities" },
  ];

  const facts = [
    { value: t("landing.facts.launchValue"), label: t("landing.facts.launchLabel") },
    { value: t("landing.facts.langValue"), label: t("landing.facts.langLabel") },
    { value: t("landing.facts.priceValue"), label: t("landing.facts.priceLabel") },
    { value: t("landing.facts.postsValue"), label: t("landing.facts.postsLabel") },
  ];

  const features = [
    { icon: MessageSquare, title: t("landing.features.collection.title"), desc: t("landing.features.collection.desc") },
    { icon: Vote, title: t("landing.features.voting.title"), desc: t("landing.features.voting.desc") },
    { icon: GitBranch, title: t("landing.features.roadmap.title"), desc: t("landing.features.roadmap.desc") },
    { icon: Camera, title: t("landing.features.attachments.title"), desc: t("landing.features.attachments.desc") },
    { icon: Globe, title: t("landing.features.languages.title"), desc: t("landing.features.languages.desc") },
    { icon: Users, title: t("landing.features.multitenant.title"), desc: t("landing.features.multitenant.desc") },
  ];

  const benefits = [
    { icon: MessageSquare, title: t("landing.benefits.hearTitle"), desc: t("landing.benefits.hearDesc") },
    { icon: BarChart3, title: t("landing.benefits.decideTitle"), desc: t("landing.benefits.decideDesc") },
    { icon: CheckCircle2, title: t("landing.benefits.showTitle"), desc: t("landing.benefits.showDesc") },
  ];

  const types = [
    { type: "feature_request" as const, label: t("type.feature_request"), desc: t("landing.types.featureDesc") },
    { type: "bug_report" as const, label: t("type.bug_report"), desc: t("landing.types.bugDesc") },
    { type: "feedback" as const, label: t("type.feedback"), desc: t("landing.types.feedbackDesc") },
  ];

  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      {/* SoftwareApplication structured data — see jsonLd() above. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[#e399a3]/25 bg-[#fdf8f9]/85 backdrop-blur-md">
        {/* Four items plus a wordmark do not fit a 360px viewport: the row grew
            wider than the screen, which is what made the whole landing page
            scroll sideways. Everything below shrinks rather than overflows. */}
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-5 sm:gap-3 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Logo className="h-8 w-8 shrink-0" />
            {/* The rose mark carries the brand on a phone; the wordmark is the
                single most expensive item in the row, so it returns as soon as
                there is room for it. */}
            <span className="hidden truncate font-display text-xl font-semibold text-[#1c0a0c] min-[420px]:inline">
              FeedBoard
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageSelector />
            <Link href="/pricing" className="hidden sm:block">
              <Button variant="ghost" className="text-[#1c0a0c]/75 hover:bg-[#c74959]/8 hover:text-[#c74959]">
                {t("nav.pricing")}
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="ghost"
                className="px-2 text-[#1c0a0c]/75 hover:bg-[#c74959]/8 hover:text-[#c74959] sm:px-4"
              >
                {t("nav.signIn")}
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#c74959] px-3 text-white hover:bg-[#b03f4d] sm:px-4">
                {t("nav.getStarted")}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      {/* Option B: centred text above the full-width system diagram
          (FeedbackLoopFlow, promoted here from its own separate "How it
          works" section further down — removed from there so it isn't shown
          twice). No side-by-side artifact anymore, so the copy is centred
          rather than left-aligned against a now-empty right column. */}
      <section className="mx-auto max-w-3xl px-5 pt-14 pb-8 text-center lg:px-8 lg:pt-24">
        <Eyebrow>{t("landing.hero.badge")}</Eyebrow>

        {/* Tracking is set here rather than in the shared Fraunces rule so
            it stays overridable and doesn't apply to small headings. */}
        <h1 className="mt-5 font-display text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.022em] text-balance text-[#1c0a0c] sm:text-6xl lg:text-[4.1rem]">
          {t("landing.hero.titleLead")}{" "}
          <span className="text-[#8f2f3b] italic">
            {t("landing.hero.titleHighlight")}
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#1c0a0c]/65">
          {t("landing.hero.subtitle")}
        </p>

        <div className="mt-9 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="h-12 w-full bg-[#c74959] px-7 text-base text-white shadow-lg shadow-[#c74959]/20 hover:bg-[#b03f4d] sm:w-auto"
            >
              {t("landing.hero.startTrial")}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          {/* Our own feedback board doubles as the live demo. The rose
              border/fill/text is the resting state (not just hover) so it
              reads as a real second button next to Start for free right
              away; hover just deepens it a step further for feedback. */}
          <a href={officialBoardUrl()} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="ghost"
              className="h-12 w-full gap-1.5 border border-[#c74959]/40 bg-[#c74959]/10 px-5 text-base text-[#c74959] hover:border-[#c74959]/60 hover:bg-[#c74959]/15 hover:text-[#c74959] sm:w-auto sm:px-6"
            >
              {t("landing.hero.seeLive")}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* The full system-flow diagram, promoted from its own "How it works"
          section into hero position (option B of two being compared — see
          HeroSystemFlow for option A's compact version, used in the hero's
          right column on the previous commit). Self-contained: renders its
          own heading, background and padding. */}
      <FeedbackLoopFlow />

      {/* ── Facts ledger ────────────────────────────────────────────────── */}
      {/* Full-bleed: the section carries the dark gradient edge-to-edge, an
          inner div constrains just the content to max-w-6xl. No rounded
          corners or shadow on the SECTION itself — a full-bleed band reads
          as a band, not an object sitting on the page.
          The four cells are genuine glass: a frosted white-on-dark recipe
          (`border-white/15 bg-white/10 backdrop-blur-sm` + an inset top
          highlight). The type cards below reuse this same recipe rather than
          a bespoke one, so every glass surface on the page is one consistent
          material. Values stay mono/tabular — this page's vocabulary for
          facts and metadata (the hero card's vote count, status labels). Gap
          replaces divide-x/divide-y now that each cell is its own bordered
          surface — a divider would double up with the card edges next to it.
          Each card also bobs gently (`lp-card-float`, globals.css) — same
          device as the flow diagram's floating cards below, translateY only,
          duration/delay staggered per card via inline style so the row
          doesn't move in mechanical unison. */}
      <section className="bg-[linear-gradient(145deg,#1c0a0c_0%,#7a2d38_45%,#c74959_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {facts.map((f, i) => (
              <div
                key={f.label}
                className="lp-card-float min-w-0 rounded-2xl border border-white/15 bg-white/10 px-5 py-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-sm sm:px-6 sm:py-7"
                style={{ animationDuration: `${6 + i * 0.4}s`, animationDelay: `${i * 0.25}s` }}
              >
                {/* Sized down on mobile on purpose: "Unlimited" set at 30px does
                    not fit a half-width column on a 360px screen, and one
                    overflowing word makes the whole page scroll sideways. */}
                <div className="font-mono text-2xl leading-none font-semibold tabular-nums break-words text-[#fdf8f9] sm:text-[28px] lg:text-3xl">
                  {f.value}
                </div>
                <div className="mt-2.5 text-sm leading-snug text-[#fdf8f9]/55">
                  {f.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ────────────────────────────────────────────────────── */}
      {/* Three claims, no card chrome. Rule + type does the separating. */}
      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="border-t border-[#1c0a0c]/12 pt-6">
              <b.icon className="h-5 w-5 text-[#c74959]" strokeWidth={1.75} />
              <h3 className="mt-4 font-display text-2xl leading-tight font-semibold text-[#1c0a0c]">
                {b.title}
              </h3>
              <p className="mt-2.5 leading-relaxed text-[#1c0a0c]/65">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <Eyebrow>{t("nav.dashboard")}</Eyebrow>
          <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance text-[#1c0a0c] lg:text-5xl">
            {t("landing.features.heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#1c0a0c]/65">
            {t("landing.features.subheading")}
          </p>
        </div>

        {/* A hairline grid rather than twelve floating cards. The dividers do
            the work the borders and drop shadows used to. */}
        <div className="mt-14 grid gap-x-12 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="border-t border-[#1c0a0c]/12 pt-6">
              <f.icon className="h-5 w-5 text-[#c74959]" strokeWidth={1.75} />
              <h3 className="mt-4 text-lg font-semibold text-[#1c0a0c]">
                {f.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#1c0a0c]/60">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What comes in ───────────────────────────────────────────────── */}
      {/* The frosted card recipe (border-white/15 bg-white/10 backdrop-blur-sm
          + inset top highlight) is the facts ledger's cells verbatim — reused
          rather than re-derived. That recipe was designed for a dark surface:
          on the page's plain #fdf8f9 it was tested and came back essentially
          invisible (no visible border, no visible tint — just floating text).
          So this section is a second full-bleed dark band, the same gradient
          as the facts ledger above, which is the only context this recipe
          actually reads in. Text and borders throughout are flipped to
          light-on-dark to match; the icon moves from brand rose (illegible on
          this red-toned gradient) to the pale accent #e399a3, which is what
          actually separates from the background. */}
      <section className="bg-[linear-gradient(145deg,#1c0a0c_0%,#7a2d38_45%,#c74959_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl leading-tight font-semibold text-balance text-[#fdf8f9] lg:text-5xl">
              {t("landing.types.heading")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#fdf8f9]/65">
              {t("landing.types.subheading")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {types.map((ty, i) => (
              <div
                key={ty.type}
                className="lp-card-float min-w-0 rounded-2xl border border-white/15 bg-white/10 px-5 py-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-sm sm:px-6 sm:py-7"
                style={{ animationDuration: `${6.2 + i * 0.4}s`, animationDelay: `${0.2 + i * 0.25}s` }}
              >
                <PostTypeIcon type={ty.type} className="h-5 w-5 text-[#e399a3]" />
                <h3 className="mt-4 text-lg font-semibold text-[#fdf8f9]">
                  {ty.label}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#fdf8f9]/60">
                  {ty.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Use-case chips. Kept as chips (they're a list of nouns, and a chip
              is the honest shape for that) but flattened: no shadow, no lift. */}
          <div className="mt-16 border-t border-white/15 pt-8">
            <p className="text-sm text-[#fdf8f9]/55">
              {t("landing.uses.subheading")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {useCases.map((u) => (
                <span
                  key={u.key}
                  className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-[#fdf8f9]/70 transition-colors hover:border-white/40 hover:text-[#fdf8f9]"
                >
                  {t(u.key)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <Eyebrow>{t("nav.pricing")}</Eyebrow>
          <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance text-[#1c0a0c] lg:text-5xl">
            {t("landing.pricing.heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#1c0a0c]/65">
            {t("landing.pricing.subheading")}
          </p>
        </div>
        <div className="mt-12">
          <PricingSection />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e399a3]/25 bg-[#fdf8f9]">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
          {/* Row 1 — identity and legal. The site's own links stay together and
              above the third-party rail, so a badge never reads as ours. */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2.5">
              <Logo className="h-6 w-6" />
              <span className="font-display text-base font-semibold text-[#1c0a0c]">
                FeedBoard
              </span>
              <span className="ml-1 text-sm text-[#1c0a0c]/45">
                {t("landing.footer.rights")}
              </span>
            </div>

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {/* Legal documents. Not localized — English is the authoritative
                  version (see components/legal/legal-shell.tsx). */}
              {legalPages.map((p) => (
                <Link
                  key={p.slug}
                  href={legalHref(p.slug)}
                  className="text-[#1c0a0c]/50 transition-colors hover:text-[#c74959]"
                >
                  {p.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Row 2 — third-party rail, on its own line under a rule. The badges
              are separately-sourced SVGs/PNGs of different intrinsic sizes, so
              each component normalises itself to a shared 36px height (h-9
              w-auto); that shared height is what makes them read as one row
              rather than a pile. Badges left, the ad slot right — it's taller
              and labelled, so it gets its own end of the row instead of
              sitting in the run. */}
          <div className="mt-8 flex flex-col items-center gap-6 border-t border-[#e399a3]/25 pt-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 lg:justify-start">
              {/* Directory backlink badges — same marketing-site-only scope as
                  AdSwap, see components/landing/*-badge.tsx. */}
              <AuraBadge />
              <FazierBadge />
              <LaunchZoneBadge />
              <TwelveToolsBadge />
              <ToolfioBadge />
              <BoostDomainRatingBadge />
            </div>

            {/* Reciprocal ad exchange — MARKETING SITE ONLY, never a tenant
                board. Renders nothing unless NEXT_PUBLIC_ADSWAP_SITE_ID is
                set. In the footer on purpose: below the fold, out of the
                signup path, and the conventional place for a link exchange. */}
            <AdSwap />
          </div>
        </div>
      </footer>
    </div>
  );
}
