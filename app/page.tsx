import { ArrowRight, ArrowUpRight, BarChart3, Camera, CheckCircle2, GitBranch, Globe, MessageSquare, Users, Vote } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PricingSection } from "@/components/pricing/pricing-section";
import { FeedbackLoopFlow } from "@/components/landing/feedback-loop-flow";
import { RequestLifecycle } from "@/components/landing/request-lifecycle";
import { PostTypeIcon } from "@/components/feedback/post-type-icon";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { getTranslation } from "@/lib/i18n/server";
import { officialBoardUrl } from "@/lib/official-board";
import { legalHref, legalPages } from "@/lib/legal";

/**
 * Marketing landing page.
 *
 * Design notes, because this page deliberately breaks the app's own house
 * style in two places:
 *
 *  - It is the ONLY surface that uses the Fraunces display face (`font-display`).
 *    The product UI stays on a single family; a marketing page needs a second,
 *    contrasting voice or it reads as a template.
 *  - Evergreen (#2f6b53) appears here and nowhere else, used strictly for
 *    "shipped". It's the one cool note in a warm palette, which is what makes
 *    the status system feel like a system rather than decoration.
 *
 * Motion budget is one orchestrated moment — the hero's RequestLifecycle. No
 * scroll-triggered reveals and no lift-on-hover across every card; that scatter
 * is most of what makes a generated page feel generated.
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
      {/* Asymmetric: the argument on the left, the artifact on the right. The
          old centred stack with three blur blobs behind it was the single most
          template-looking thing on the page. */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-16 lg:px-8 lg:pt-24 lg:pb-24">
        {/* min-w-0 on both cells: grid children default to min-width:auto, so a
            long unbreakable word in either column can force the whole page
            wider than the viewport instead of wrapping. */}
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="min-w-0">
            <Eyebrow>{t("landing.hero.badge")}</Eyebrow>

            {/* Tracking is set here rather than in the shared Fraunces rule so
                it stays overridable and doesn't apply to small headings. */}
            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.022em] text-balance text-[#1c0a0c] sm:text-6xl lg:text-[4.1rem]">
              {t("landing.hero.titleLead")}{" "}
              <span className="text-[#8f2f3b] italic">
                {t("landing.hero.titleHighlight")}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#1c0a0c]/65">
              {t("landing.hero.subtitle")}
            </p>

            {/* items-start so the secondary link sits on the left margin with
                everything else on mobile. Stretching it full-width centred its
                label, which was the one thing fighting the left-aligned grid. */}
            <div className="mt-9 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
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
          </div>

          <div className="flex min-w-0 justify-center lg:justify-end">
            <RequestLifecycle />
          </div>
        </div>
      </section>

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

      {/* ── How it works ────────────────────────────────────────────────── */}
      {/* Self-contained illustrated infographic: renders its own section,
          heading and background. Left as-is — it's the most bespoke thing on
          the page and the redesign is written to match its register. */}
      <FeedbackLoopFlow />

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
              is the honest shape for that) but flattened: no shadow, no lift.
              Float the same way as the cards above (lp-card-float,
              globals.css) so the whole section shares one moving vocabulary
              instead of the cards being the only thing that drifts. */}
          <div className="mt-16 border-t border-white/15 pt-8">
            <p className="text-sm text-[#fdf8f9]/55">
              {t("landing.uses.subheading")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {useCases.map((u, i) => (
                <span
                  key={u.key}
                  className="lp-card-float rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-[#fdf8f9]/70 transition-colors hover:border-white/40 hover:text-[#fdf8f9]"
                  style={{ animationDuration: `${5.5 + (i % 4) * 0.4}s`, animationDelay: `${(i % 4) * 0.2}s` }}
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
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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
      </footer>
    </div>
  );
}
