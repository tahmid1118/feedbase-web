import { ArrowRight, BarChart3, Camera, CheckCircle2, GitBranch, Globe, MessageSquare, MessageSquarePlus, Users, Vote } from "lucide-react";
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
              {/* Our own feedback board doubles as the live demo. */}
              <a href={officialBoardUrl()}>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-12 px-3 text-base text-[#1c0a0c]/75 underline-offset-4 hover:bg-transparent hover:text-[#c74959] hover:underline sm:px-5"
                >
                  {t("landing.hero.seeLive")}
                </Button>
              </a>
            </div>

            <p className="mt-5 font-mono text-xs tracking-wide text-[#1c0a0c]/40">
              {t("landing.flow.noAccount")} · {t("landing.facts.priceValue")}{" "}
              {t("landing.facts.priceLabel")}
            </p>
          </div>

          <div className="flex min-w-0 justify-center lg:justify-end">
            <RequestLifecycle />
          </div>
        </div>
      </section>

      {/* ── Facts ledger ────────────────────────────────────────────────── */}
      {/* Contained in the same max-w-6xl column as everything else (was
          full-bleed). A plain white box with the values in the display face
          was still just a generic four-stat grid — the same shape as every
          template's "trust bar". Two changes make it specific instead:
            - Values are mono/tabular, the vocabulary this page already uses
              for facts and metadata (the hero card's vote count, status
              labels) — these ARE terse measured specs, not a headline.
            - divide-x/divide-y turns the boundary between facts into real
              structure (a spec sheet has ruled cells) rather than gap+weight
              doing the separating, and the elevated shadow pairs it with the
              hero card as the page's only two "lifted object" surfaces. */}
      <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="overflow-hidden rounded-2xl border border-[#e399a3]/35 bg-white shadow-[0_24px_60px_-36px_rgba(28,10,12,0.35)]">
          <div className="grid grid-cols-2 divide-x divide-y divide-[#e399a3]/25 sm:grid-cols-4 sm:divide-y-0">
            {facts.map((f) => (
              <div key={f.label} className="min-w-0 px-6 py-8 sm:px-7 sm:py-9 lg:px-8">
                {/* Sized down on mobile on purpose: "Unlimited" set at 30px does
                    not fit a half-width column on a 360px screen, and one
                    overflowing word makes the whole page scroll sideways. */}
                <div className="font-mono text-2xl leading-none font-semibold tabular-nums break-words text-[#1c0a0c] sm:text-[28px] lg:text-3xl">
                  {f.value}
                </div>
                <div className="mt-2.5 text-sm leading-snug text-[#1c0a0c]/55">
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
      <section className="border-y border-[#e399a3]/30 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl leading-tight font-semibold text-balance text-[#1c0a0c] lg:text-5xl">
              {t("landing.types.heading")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#1c0a0c]/65">
              {t("landing.types.subheading")}
            </p>
          </div>

          <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-3">
            {types.map((ty) => (
              <div key={ty.type} className="border-t border-[#1c0a0c]/12 pt-6">
                <PostTypeIcon
                  type={ty.type}
                  className="h-5 w-5 text-[#c74959]"
                />
                <h3 className="mt-4 text-lg font-semibold text-[#1c0a0c]">
                  {ty.label}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#1c0a0c]/60">
                  {ty.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Use-case chips. Kept as chips (they're a list of nouns, and a chip
              is the honest shape for that) but flattened: no shadow, no lift. */}
          <div className="mt-16 border-t border-[#1c0a0c]/12 pt-8">
            <p className="text-sm text-[#1c0a0c]/55">
              {t("landing.uses.subheading")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {useCases.map((u) => (
                <span
                  key={u.key}
                  className="rounded-full border border-[#e399a3]/50 px-3.5 py-1.5 text-sm text-[#1c0a0c]/70 transition-colors hover:border-[#c74959]/50 hover:text-[#c74959]"
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

      {/* ── Closing ─────────────────────────────────────────────────────── */}
      {/* The rest of this page is deliberately flat and light — glass needs
          real contrast behind it to blur, which is exactly what a flat #fdf8f9
          background can't give it. This is the one surface dark enough to
          support it, so it's also the one place that borrows the login/signup
          aside's recipe (the 145deg ink→rose gradient + a frosted white-on-dark
          panel) rather than that treatment staying stranded on the auth pages.
          Still one dark surface and one glass element — restraint holds. */}
      <section className="bg-[linear-gradient(145deg,#1c0a0c_0%,#7a2d38_45%,#c74959_100%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-20 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-24">
          <div className="max-w-xl">
            {/* The one glass moment on the page. Reuses the price fact from the
                spec-sheet card above rather than new copy, so the chip and the
                card agree on what "$0" means instead of two different claims. */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#fdf8f9]/20 bg-[#fdf8f9]/10 px-4 py-1.5 backdrop-blur-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#fdf8f9]/80" />
              <span className="font-mono text-xs text-[#fdf8f9]/85">
                {facts[2].value} {facts[2].label}
              </span>
            </div>

            <h2 className="mt-5 font-display text-4xl leading-tight font-semibold text-balance text-[#fdf8f9] lg:text-5xl">
              {t("landing.cta.heading")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#fdf8f9]/65">
              {t("landing.cta.subheading")}
            </p>
          </div>
          <Link href="/signup" className="shrink-0">
            <Button
              size="lg"
              className="h-12 w-full bg-[#fdf8f9] px-7 text-base text-[#1c0a0c] hover:bg-white sm:w-auto"
            >
              {t("landing.hero.startTrial")}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
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
            {/* Our own board — reachable without an account, so logged-out
                visitors can report bugs and request features too. */}
            <a
              href={officialBoardUrl()}
              className="inline-flex items-center gap-1.5 font-medium text-[#c74959] hover:underline"
            >
              <MessageSquarePlus className="h-4 w-4" />
              {t("landing.footer.giveFeedback")}
            </a>
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
