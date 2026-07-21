import { ArrowRight, BarChart3, Camera, CheckCircle2, GitBranch, Globe, MessageSquare, MessageSquarePlus, Sparkles, ThumbsUp, Users, Vote } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PricingSection } from "@/components/pricing/pricing-section";
import { FeedbackLoopFlow } from "@/components/landing/feedback-loop-flow";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { getTranslation } from "@/lib/i18n/server";
import { officialBoardUrl } from "@/lib/official-board";

export default async function HomePage() {
  const session = await auth();
  const { t } = await getTranslation();

  if (session?.user?.userId) {
    redirect("/dashboard");
  }

  // Mock feedback cards floating in the hero — a miniature of the real board.
  const mockPosts = [
    { title: t("landing.mock.post1"), votes: 128, statusKey: "status.planned", badge: "bg-purple-100 text-purple-700", tilt: "-rotate-2" },
    { title: t("landing.mock.post2"), votes: 96, statusKey: "status.in_progress", badge: "bg-yellow-100 text-yellow-700", tilt: "rotate-1" },
    { title: t("landing.mock.post3"), votes: 74, statusKey: "status.completed", badge: "bg-green-100 text-green-700", tilt: "-rotate-1" },
  ];

  // "Works for anything people use" — the use-case chips.
  const useCases = [
    { emoji: "💻", key: "landing.uses.saas" },
    { emoji: "📱", key: "landing.uses.mobile" },
    { emoji: "🛍️", key: "landing.uses.ecommerce" },
    { emoji: "🎮", key: "landing.uses.games" },
    { emoji: "🏢", key: "landing.uses.agencies" },
    { emoji: "🔧", key: "landing.uses.hardware" },
    { emoji: "🤝", key: "landing.uses.services" },
    { emoji: "🌐", key: "landing.uses.communities" },
  ];

  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      {/* Navigation */}
      <nav className="border-b border-[#e399a3]/20 bg-white/60 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-[#1c0a0c]">Feedbase</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link href="/pricing" className="hidden sm:block">
              <Button variant="ghost" className="text-[#1c0a0c] hover:bg-[#c74959]/10 hover:text-[#c74959]">
                {t("nav.pricing")}
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-[#1c0a0c] hover:bg-[#c74959]/10 hover:text-[#c74959]">
                {t("nav.signIn")}
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#c74959] text-white hover:bg-[#b03f4d]">
                {t("nav.getStarted")}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div aria-hidden className="pointer-events-none absolute -left-32 top-8 h-80 w-80 rounded-full bg-[#c74959]/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-[#da6a78]/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#e399a3]/20 blur-3xl" />

        <div className="container relative mx-auto px-4 pb-14 pt-20 text-center">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c74959]/20 bg-white/80 px-4 py-2 text-sm text-[#c74959] shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>{t("landing.hero.badge")}</span>
            </div>

            <h1 className="text-5xl font-bold leading-tight text-[#1c0a0c] sm:text-6xl lg:text-7xl">
              {t("landing.hero.titleLead")}{" "}
              <span className="bg-gradient-to-r from-[#c74959] to-[#da6a78] bg-clip-text text-transparent">
                {t("landing.hero.titleHighlight")}
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-[#1c0a0c]/70 sm:text-xl">
              {t("landing.hero.subtitle")}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="h-12 bg-[#c74959] px-8 text-base text-white shadow-lg shadow-[#c74959]/25 transition-transform hover:-translate-y-0.5 hover:bg-[#b03f4d]">
                  {t("landing.hero.startTrial")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {/* Our own feedback board doubles as the live demo. */}
              <a href={officialBoardUrl()}>
                <Button size="lg" variant="outline" className="h-12 border-[#c74959] bg-transparent px-8 text-base text-[#c74959] hover:bg-[#c74959] hover:text-white">
                  {t("landing.hero.seeLive")}
                </Button>
              </a>
            </div>
          </div>

          {/* Miniature board — three floating post cards */}
          <div className="mx-auto mt-16 flex max-w-3xl flex-col items-stretch justify-center gap-4 sm:flex-row">
            {mockPosts.map((post) => (
              <div
                key={post.statusKey}
                className={`flex flex-1 flex-col gap-3 rounded-2xl border border-[#e399a3]/30 bg-white p-4 text-left shadow-lg shadow-[#c74959]/5 transition-transform duration-300 hover:-translate-y-2 hover:rotate-0 ${post.tilt}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1c0a0c]">{post.title}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${post.badge}`}>
                    {t(post.statusKey)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#1c0a0c]/60">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#e399a3]/40 px-2 py-1 font-semibold text-[#c74959]">
                    <ThumbsUp className="h-3 w-3" /> {post.votes}
                  </span>
                  <MessageSquare className="ml-1 h-3 w-3" /> {12 + post.votes % 9}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases — any product */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold text-[#1c0a0c]">{t("landing.uses.heading")}</h2>
          <p className="text-lg text-[#1c0a0c]/70">{t("landing.uses.subheading")}</p>
        </div>
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
          {useCases.map((u) => (
            <span
              key={u.key}
              className="inline-flex items-center gap-2 rounded-full border border-[#e399a3]/40 bg-white px-4 py-2 text-sm font-medium text-[#1c0a0c]/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#c74959]/50 hover:text-[#c74959]"
            >
              <span>{u.emoji}</span> {t(u.key)}
            </span>
          ))}
        </div>
      </section>

      {/* Benefits — how you win, in three words */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-8 text-center transition-all hover:-translate-y-1 hover:border-[#c74959]/40 hover:shadow-xl hover:shadow-[#c74959]/5">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c74959]/10 text-[#c74959]">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-[#1c0a0c]">{t("landing.benefits.hearTitle")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.benefits.hearDesc")}</p>
          </div>
          <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-8 text-center transition-all hover:-translate-y-1 hover:border-[#c74959]/40 hover:shadow-xl hover:shadow-[#c74959]/5">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#da6a78]/10 text-[#da6a78]">
              <BarChart3 className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-[#1c0a0c]">{t("landing.benefits.decideTitle")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.benefits.decideDesc")}</p>
          </div>
          <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-8 text-center transition-all hover:-translate-y-1 hover:border-[#c74959]/40 hover:shadow-xl hover:shadow-[#c74959]/5">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e399a3]/20 text-[#c74959]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-[#1c0a0c]">{t("landing.benefits.showTitle")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.benefits.showDesc")}</p>
          </div>
        </div>
      </section>

      {/* Honest facts strip (replaces the invented stats) */}
      <section className="border-y border-[#e399a3]/20 bg-gradient-to-r from-[#c74959] to-[#da6a78] py-14">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="mb-1 text-4xl font-bold text-white">{t("landing.facts.launchValue")}</div>
              <div className="text-white/90">{t("landing.facts.launchLabel")}</div>
            </div>
            <div>
              <div className="mb-1 text-4xl font-bold text-white">{t("landing.facts.langValue")}</div>
              <div className="text-white/90">{t("landing.facts.langLabel")}</div>
            </div>
            <div>
              <div className="mb-1 text-4xl font-bold text-white">{t("landing.facts.priceValue")}</div>
              <div className="text-white/90">{t("landing.facts.priceLabel")}</div>
            </div>
            <div>
              <div className="mb-1 text-4xl font-bold text-white">{t("landing.facts.postsValue")}</div>
              <div className="text-white/90">{t("landing.facts.postsLabel")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">{t("landing.features.heading")}</h2>
          <p className="text-lg text-[#1c0a0c]/70">{t("landing.features.subheading")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#c74959]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#c74959]/10 text-[#c74959]">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.collection.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.collection.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#da6a78]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#da6a78]/10 text-[#da6a78]">
              <Vote className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.voting.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.voting.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#c74959]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e399a3]/20 text-[#c74959]">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.roadmap.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.roadmap.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#da6a78]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#da6a78]/10 text-[#da6a78]">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.attachments.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.attachments.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#c74959]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#c74959]/10 text-[#c74959]">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.languages.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.languages.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#da6a78]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e399a3]/20 text-[#c74959]">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.multitenant.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.multitenant.desc")}</p>
          </div>
        </div>
      </section>

      {/* How It Works — the feedback loop as a flat-design infographic.
          Self-contained: renders its own section, heading and background. */}
      <FeedbackLoopFlow />

      {/* Every kind of input (replaces the invented testimonials) */}
      <section className="bg-[#fdf8f9] py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">{t("landing.types.heading")}</h2>
            <p className="text-lg text-[#1c0a0c]/70">{t("landing.types.subheading")}</p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-3 text-4xl">✨</div>
              <h3 className="mb-2 text-lg font-semibold text-[#1c0a0c]">{t("type.feature_request")}</h3>
              <p className="text-sm text-[#1c0a0c]/70">{t("landing.types.featureDesc")}</p>
            </div>
            <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-3 text-4xl">🐛</div>
              <h3 className="mb-2 text-lg font-semibold text-[#1c0a0c]">{t("type.bug_report")}</h3>
              <p className="text-sm text-[#1c0a0c]/70">{t("landing.types.bugDesc")}</p>
            </div>
            <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-3 text-4xl">💬</div>
              <h3 className="mb-2 text-lg font-semibold text-[#1c0a0c]">{t("type.feedback")}</h3>
              <p className="text-sm text-[#1c0a0c]/70">{t("landing.types.feedbackDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">{t("landing.pricing.heading")}</h2>
          <p className="text-lg text-[#1c0a0c]/70">{t("landing.pricing.subheading")}</p>
        </div>
        <div className="mx-auto max-w-5xl">
          <PricingSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#c74959] to-[#da6a78] p-12 text-center text-white">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative mb-4 text-4xl font-bold">{t("landing.cta.heading")}</h2>
          <p className="relative mb-8 text-lg text-white/90">{t("landing.cta.subheading")}</p>
          <Link href="/signup" className="relative inline-block">
            <Button size="lg" className="h-12 bg-white px-8 text-base text-[#c74959] transition-transform hover:-translate-y-0.5 hover:bg-[#fdf8f9]">
              {t("landing.hero.startTrial")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e399a3]/20 bg-white py-8">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 text-center text-sm text-[#1c0a0c]/70">
          <p>{t("landing.footer.rights")}</p>
          {/* Our own board — reachable without an account, so logged-out
              visitors can report bugs and request features too. */}
          <a
            href={officialBoardUrl()}
            className="inline-flex items-center gap-1.5 font-medium text-[#c74959] hover:underline"
          >
            <MessageSquarePlus className="h-4 w-4" />
            {t("landing.footer.giveFeedback")}
          </a>
        </div>
      </footer>
    </div>
  );
}
