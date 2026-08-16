import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Ban, BarChart3, Camera, CheckCircle2, GitBranch, MessageSquare, RotateCcw, ShieldCheck, Vote } from "@/components/icons";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PricingSection } from "@/components/pricing/pricing-section";
import { FeedbackLoopFlow } from "@/components/landing/feedback-loop-flow";
import { ComparisonTable } from "@/components/landing/comparison-table";
import { LandingFaq } from "@/components/landing/landing-faq";
import { ProductProof } from "@/components/landing/product-proof";
import { ScreenshotOrbit } from "@/components/landing/screenshot-orbit";
import { AdSwap } from "@/components/landing/ad-swap";
import { AuraBadge } from "@/components/landing/aura-badge";
import { BoostDomainRatingBadge } from "@/components/landing/boost-domain-rating-badge";
import { FazierBadge } from "@/components/landing/fazier-badge";
import { LaunchZoneBadge } from "@/components/landing/launchzone-badge";
import { ToolfioBadge } from "@/components/landing/toolfio-badge";
import { TwelveToolsBadge } from "@/components/landing/twelve-tools-badge";
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

  const facts = [
    { value: t("landing.facts.launchValue"), label: t("landing.facts.launchLabel") },
    { value: t("landing.facts.langValue"), label: t("landing.facts.langLabel") },
    { value: t("landing.facts.priceValue"), label: t("landing.facts.priceLabel") },
    { value: t("landing.facts.postsValue"), label: t("landing.facts.postsLabel") },
  ];

  // Four, not six. "8 languages" and "multi-workspace" were dropped: neither
  // is something a first-time visitor is choosing on, and a six-item grid
  // spends attention on the two weakest cells.
  const features = [
    { icon: MessageSquare, title: t("landing.features.collection.title"), desc: t("landing.features.collection.desc") },
    { icon: Vote, title: t("landing.features.voting.title"), desc: t("landing.features.voting.desc") },
    { icon: GitBranch, title: t("landing.features.roadmap.title"), desc: t("landing.features.roadmap.desc") },
    { icon: Camera, title: t("landing.features.attachments.title"), desc: t("landing.features.attachments.desc") },
  ];

  // The rebuttal to the hero's claim. Order is the order a sceptic asks:
  // how do you catch it → what happens to it → what if you're wrong.
  const spamPoints = [
    { icon: ShieldCheck, title: t("landing.spam.scoredTitle"), desc: t("landing.spam.scoredDesc") },
    { icon: Ban, title: t("landing.spam.quarantineTitle"), desc: t("landing.spam.quarantineDesc") },
    { icon: RotateCcw, title: t("landing.spam.restoreTitle"), desc: t("landing.spam.restoreDesc") },
  ];

  const benefits = [
    { icon: MessageSquare, title: t("landing.benefits.hearTitle"), desc: t("landing.benefits.hearDesc") },
    { icon: BarChart3, title: t("landing.benefits.decideTitle"), desc: t("landing.benefits.decideDesc") },
    { icon: CheckCircle2, title: t("landing.benefits.showTitle"), desc: t("landing.benefits.showDesc") },
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
          {/* Our own feedback board doubles as the live demo, and for a product
              whose value is visual and social, letting someone LOOK before
              committing is the shortest path to trust — so this is a
              co-equal CTA (solid surface, full-strength border and text),
              not a de-emphasised ghost. The audit found 87% of visitors
              leaving the homepage without ever seeing the product. */}
          <a href={officialBoardUrl()} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="ghost"
              className="h-12 w-full gap-1.5 border-2 border-[#c74959] bg-white px-7 text-base font-medium text-[#c74959] shadow-sm hover:bg-[#c74959]/8 hover:text-[#c74959] sm:w-auto"
            >
              {t("landing.hero.seeLive")}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </a>
        </div>

        {/* Risk reducer directly under the CTAs — answers "what happens if I
            click?", which the audit flagged as unanswered at the decision
            point. */}
        <p className="mt-4 font-mono text-[12px] tracking-[0.04em] text-[#1c0a0c]/45">
          {t("landing.hero.heroNote")}
        </p>
      </section>

      {/* The hero's visual, and full-bleed by necessity — the arc only reads as
          a curve if it runs past both edges of the screen, which it cannot do
          inside the hero's own max-w-3xl column. Decorative (aria-hidden): the
          same screenshots are presented legibly, with captions, in
          ProductProof further down. */}
      <ScreenshotOrbit />

      {/* ── Spam protection ─────────────────────────────────────────────── */}
      {/* Position is the whole point: the hero now claims anyone can post
          WITHOUT an account, and the first thing a founder thinks is "so
          won't I drown in junk?". An objection left hanging discredits the
          claim that raised it, so the answer goes immediately after the
          hero — before the flow diagram, before features, before anything
          else competes for the thought.

          Visually it's a tinted band with hairline edges rather than a card
          grid: deep enough to read as its own beat (this is a rebuttal, not
          another feature), quiet enough not to fight the hero directly above
          it. The three columns reuse the border-t + icon + heading recipe
          from Benefits/Features rather than inventing a fourth card style. */}
      <section className="border-y border-[#e399a3]/30 bg-[#fbeef0]">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <Eyebrow>{t("landing.spam.eyebrow")}</Eyebrow>
            <h2 className="mt-4 font-display text-3xl leading-tight font-semibold text-balance text-[#1c0a0c] lg:text-4xl">
              {t("landing.spam.heading")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#1c0a0c]/65">
              {t("landing.spam.subheading")}
            </p>
          </div>

          <div className="mt-12 grid gap-x-12 gap-y-9 md:grid-cols-3">
            {spamPoints.map((s) => (
              <div key={s.title} className="border-t border-[#1c0a0c]/12 pt-6">
                <s.icon className="h-5 w-5 text-[#c74959]" strokeWidth={1.75} />
                <h3 className="mt-4 text-lg font-semibold text-[#1c0a0c]">
                  {s.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#1c0a0c]/60">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product proof ───────────────────────────────────────────────── */}
      {/* Real screenshots, placed before the abstract flow diagram on
          purpose: proof comes before explanation. This was the single
          biggest gap the audit found — a visitor could read the entire page
          without ever seeing the actual product. */}
      <ProductProof t={t} />

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

      {/* The "What comes in" band (post-type cards + eight use-case chips)
          stood here and was removed deliberately, not lost in a refactor. It
          was the THIRD consecutive "here's what it does" block before pricing,
          and the chips listed eight audiences — which reads as serving nobody
          in particular rather than as breadth. The page now names one ICP in
          the hero and spends this space on nothing at all, which is the
          cheaper trade. */}

      {/* ── Comparison ──────────────────────────────────────────────────── */}
      {/* Placed BEFORE pricing on purpose: a visitor deciding between us and
          Canny/UserJot needs the difference settled before a number means
          anything to them. Every cell is sourced from the competitor's own
          public pages — see the component's header for what was verified and
          when, and why that matters more here than anywhere else on the site. */}
      <ComparisonTable t={t} />

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

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      {/* Last objections, answered at the decision point rather than on the
          separate /faq route almost nobody reaches (3 visitors in 30 days). */}
      <LandingFaq t={t} />

      {/* ── Closing CTA ─────────────────────────────────────────────────── */}
      {/* The page previously ran from pricing straight into the footer, so a
          visitor convinced by the pricing table had nothing to act on without
          scrolling back up. The `landing.cta.*` copy existed in the
          dictionaries all along but was never wired to any JSX — this is the
          first time it renders. Reuses the facts-ledger gradient: one
          material, used twice, rather than a new surface for the close. */}
      <section className="bg-[linear-gradient(145deg,#1c0a0c_0%,#7a2d38_45%,#c74959_100%)]">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center lg:px-8 lg:py-24">
          <h2 className="font-display text-4xl leading-tight font-semibold text-balance text-[#fdf8f9] lg:text-5xl">
            {t("landing.cta.heading")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[#fdf8f9]/70">
            {t("landing.cta.subheading")}
          </p>
          <div className="mt-9 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="h-12 w-full bg-[#fdf8f9] px-7 text-base text-[#1c0a0c] shadow-lg hover:bg-white sm:w-auto"
              >
                {t("landing.hero.startTrial")}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <a href={officialBoardUrl()} className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 w-full gap-1.5 border-2 border-[#fdf8f9]/45 px-7 text-base text-[#fdf8f9] hover:bg-[#fdf8f9]/10 hover:text-[#fdf8f9] sm:w-auto"
              >
                {t("landing.hero.seeLive")}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
          <p className="mt-5 font-mono text-[12px] tracking-[0.04em] text-[#fdf8f9]/50">
            {t("landing.hero.heroNote")}
          </p>
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
